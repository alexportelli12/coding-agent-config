#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const METADATA_FILE = "opencode-implementation.json";
const LOCK_DIRECTORY = "opencode-implementation.lock";

class WorkspaceError extends Error {
  constructor(message, details = "") {
    super(details ? `${message}\n${details}` : message);
    this.name = "WorkspaceError";
  }
}

function redactEndpoint(value) {
  return value.replace(
    /([a-z][a-z0-9+.-]*:\/\/)([^\s/?#]*)([^\s?#]*)(\?[^\s#]*)?/gi,
    (_match, scheme, authority, pathname, query) => {
      const safeAuthority = authority.includes("@")
        ? `[redacted]@${authority.slice(authority.lastIndexOf("@") + 1)}`
        : authority;
      return `${scheme}${safeAuthority}${pathname}${query ? "?[redacted]" : ""}`;
    },
  );
}

function canonicalRemoteUrl(value, controlRoot) {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || /^[^/\\]+:.+/.test(value)) {
    return value;
  }
  if (value.startsWith("~")) {
    throw new WorkspaceError(
      "the remote uses a home-relative URL",
      "Configure an absolute path so linked worktrees resolve the same endpoint.",
    );
  }
  return path.resolve(controlRoot, value);
}

function run(command, args, options = {}) {
  const allowedExitCodes = options.allowedExitCodes ?? [0];
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", (error) => reject(new WorkspaceError(
      `could not run ${command}`,
      error.message,
    )));
    child.once("close", (code, signal) => {
      const result = {
        code: code ?? 1,
        signal,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      };
      if (signal || !allowedExitCodes.includes(result.code)) {
        const diagnostics = redactEndpoint(result.stderr.trim() || result.stdout.trim()) ||
          `exit code ${result.code}${signal ? ` (signal ${signal})` : ""}`;
        reject(new WorkspaceError(
          `command failed: ${command} ${args.map(redactEndpoint).join(" ")}`,
          diagnostics,
        ));
        return;
      }
      resolve(result);
    });
  });
}

async function git(cwd, args, options = {}) {
  return run("git", args, { ...options, cwd });
}

function cleanOutput(result) {
  return result.stdout.trim();
}

async function canonicalPath(value) {
  return realpath(value);
}

async function repositoryAt(cwd) {
  const rootResult = await git(cwd, ["rev-parse", "--show-toplevel"]);
  const root = await canonicalPath(cleanOutput(rootResult));
  const gitDirectory = await canonicalPath(cleanOutput(
    await git(root, ["rev-parse", "--absolute-git-dir"]),
  ));
  const commonValue = cleanOutput(await git(root, ["rev-parse", "--git-common-dir"]));
  const commonDirectory = await canonicalPath(path.resolve(root, commonValue));
  return { root, gitDirectory, commonDirectory };
}

async function currentBranch(root) {
  const result = await git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"], {
    allowedExitCodes: [0, 1],
  });
  if (result.code !== 0 || !cleanOutput(result)) {
    throw new WorkspaceError("the worktree has a detached HEAD");
  }
  return cleanOutput(result);
}

async function assertClean(root, label) {
  const result = await git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  if (result.stdout.length > 0) {
    const readable = cleanOutput(await git(root, ["status", "--short", "--untracked-files=all"]));
    throw new WorkspaceError(
      `${label} contains uncommitted or untracked work`,
      readable || "Git reported a non-clean worktree.",
    );
  }
}

async function pathExists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function assertNoGitOperation(repository) {
  const operationPaths = [
    "MERGE_HEAD",
    "CHERRY_PICK_HEAD",
    "REVERT_HEAD",
    "REBASE_HEAD",
    "rebase-apply",
    "rebase-merge",
  ];
  for (const operationPath of operationPaths) {
    const resolved = cleanOutput(await git(repository.root, ["rev-parse", "--git-path", operationPath]));
    if (await pathExists(path.resolve(repository.root, resolved))) {
      throw new WorkspaceError(`an unfinished Git operation is present (${operationPath})`);
    }
  }
}

async function configuredRemote(root, branch) {
  const configured = await git(root, ["config", "--get", `branch.${branch}.remote`], {
    allowedExitCodes: [0, 1],
  });
  if (configured.code === 0 && cleanOutput(configured) && cleanOutput(configured) !== ".") {
    return cleanOutput(configured);
  }

  const remotes = cleanOutput(await git(root, ["remote"])).split("\n").filter(Boolean);
  if (remotes.length === 1) return remotes[0];
  if (remotes.length === 0) {
    throw new WorkspaceError("the repository has no configured remote");
  }
  throw new WorkspaceError(
    "the repository remote is ambiguous",
    `Configure an upstream for ${branch}; available remotes: ${remotes.join(", ")}`,
  );
}

async function remoteDefault(root, remote) {
  const result = await git(root, ["ls-remote", "--symref", remote, "HEAD"]);
  const match = result.stdout.match(/^ref: refs\/heads\/(.+)\tHEAD$/m);
  if (!match) {
    throw new WorkspaceError(
      `remote ${redactEndpoint(remote)} did not advertise a default branch`,
      "Set the remote's HEAD/default branch before using /implement.",
    );
  }
  return match[1];
}

async function fetchBranch(root, remote, branch) {
  await git(root, ["fetch", "--quiet", "--no-tags", remote, `refs/heads/${branch}`]);
  return cleanOutput(await git(root, ["rev-parse", "--verify", "FETCH_HEAD^{commit}"]));
}

async function remoteBranchSha(root, remote, branch) {
  const result = await git(root, ["ls-remote", "--branches", remote, `refs/heads/${branch}`]);
  const line = result.stdout.trim();
  if (!line) return null;
  const [sha, ref, ...extra] = line.split(/\s+/);
  if (extra.length > 0 || ref !== `refs/heads/${branch}` || !/^[0-9a-f]+$/i.test(sha)) {
    throw new WorkspaceError(
      `remote ${redactEndpoint(remote)} returned an unexpected ref for ${branch}`,
    );
  }
  return sha;
}

async function isAncestor(root, ancestor, descendant) {
  const result = await git(root, ["merge-base", "--is-ancestor", ancestor, descendant], {
    allowedExitCodes: [0, 1],
  });
  return result.code === 0;
}

async function refExists(root, ref) {
  const result = await git(root, ["show-ref", "--verify", "--quiet", ref], {
    allowedExitCodes: [0, 1],
  });
  return result.code === 0;
}

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    return true;
  }
}

async function acquireRepositoryLock(commonDirectory) {
  const lockPath = path.join(commonDirectory, LOCK_DIRECTORY);
  const owner = {
    hostname: os.hostname(),
    pid: process.pid,
    token: randomUUID(),
    startedAt: new Date().toISOString(),
  };

  const deadline = Date.now() + 30_000;
  let unreadableSince = null;
  while (true) {
    try {
      await mkdir(lockPath);
      await writeFile(path.join(lockPath, "owner.json"), `${JSON.stringify(owner)}\n`, { mode: 0o600 });
      return { lockPath, owner };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      let existing;
      try {
        existing = JSON.parse(await readFile(path.join(lockPath, "owner.json"), "utf8"));
      } catch {
        unreadableSince ??= Date.now();
        if (Date.now() - unreadableSince < 500) {
          await new Promise((resolve) => setTimeout(resolve, 25));
          continue;
        }
        throw new WorkspaceError(
          "repository lifecycle lock has no readable owner",
          `Inspect ${lockPath}; it was not removed automatically because ownership is ambiguous.`,
        );
      }
      unreadableSince = null;
      if (existing.hostname !== os.hostname() || processIsAlive(existing.pid)) {
        if (Date.now() >= deadline) {
          throw new WorkspaceError(
            "timed out waiting for another implementation workspace operation",
            `Lock owner: pid ${existing.pid} on ${existing.hostname}, started ${existing.startedAt}`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      const stalePath = `${lockPath}.stale-${owner.token}`;
      try {
        await rename(lockPath, stalePath);
        await rm(stalePath, { recursive: true, force: true });
      } catch (renameError) {
        if (renameError.code !== "ENOENT") throw renameError;
      }
    }
  }
}

async function releaseRepositoryLock(lock) {
  try {
    const existing = JSON.parse(await readFile(path.join(lock.lockPath, "owner.json"), "utf8"));
    if (existing.token === lock.owner.token) {
      await rm(lock.lockPath, { recursive: true, force: true });
    }
  } catch {
    // A missing or replaced lock must not cause a successful Git operation to fail.
  }
}

async function withRepositoryLock(commonDirectory, operation) {
  const lock = await acquireRepositoryLock(commonDirectory);
  try {
    return await operation();
  } finally {
    await releaseRepositoryLock(lock);
  }
}

function sanitizeSegment(value, fallback) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return normalized || fallback;
}

function sanitizePrefix(value) {
  return value
    .split("/")
    .map((segment) => sanitizeSegment(segment, "work"))
    .join("/");
}

function workspaceRoot(repository, environment = process.env) {
  const configured = environment.OPENCODE_WORKTREE_ROOT;
  const base = configured || path.join(
    environment.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share"),
    "opencode",
    "implementation-worktrees",
  );
  const repositoryName = sanitizeSegment(path.basename(repository.root), "repository");
  const identity = createHash("sha256").update(repository.commonDirectory).digest("hex").slice(0, 10);
  return path.resolve(base, `${repositoryName}-${identity}`);
}

async function writeMetadata(gitDirectory, metadata) {
  const destination = path.join(gitDirectory, METADATA_FILE);
  const temporary = `${destination}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(metadata, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, destination);
}

async function readMetadata(gitDirectory) {
  try {
    return JSON.parse(await readFile(path.join(gitDirectory, METADATA_FILE), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new WorkspaceError("this worktree has no OpenCode implementation ownership metadata");
    }
    throw new WorkspaceError("implementation ownership metadata is invalid", error.message);
  }
}

async function allocateWorkspace(repository, root, pushUrl, slug, prefix, baseSha) {
  const parent = workspaceRoot(repository);
  await mkdir(parent, { recursive: true });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const sessionId = randomBytes(12).toString("hex");
    const leaf = `${sanitizeSegment(slug, "change")}-${sessionId.slice(0, 10)}`;
    const branch = `${sanitizePrefix(prefix || "opencode")}/${leaf}`;
    const worktreePath = path.join(parent, leaf);
    await git(root, ["check-ref-format", "--branch", branch]);
    if (await refExists(root, `refs/heads/${branch}`)) continue;
    if (await remoteBranchSha(root, pushUrl, branch)) continue;
    if (await pathExists(worktreePath)) continue;
    return { sessionId, branch, worktreePath };
  }
  throw new WorkspaceError("could not allocate a collision-free branch and worktree path");
}

async function rollbackAllocatedWorkspace(root, allocation, baseSha) {
  try {
    await git(root, ["worktree", "unlock", allocation.worktreePath], { allowedExitCodes: [0, 128] });
    await git(root, ["worktree", "remove", allocation.worktreePath], { allowedExitCodes: [0, 128] });
  } catch {
    // Continue to the branch check; all cleanup is limited to this allocation.
  }
  try {
    const ref = `refs/heads/${allocation.branch}`;
    if (await refExists(root, ref)) {
      const current = cleanOutput(await git(root, ["rev-parse", "--verify", `${ref}^{commit}`]));
      if (current === baseSha) await git(root, ["branch", "-d", allocation.branch]);
    }
  } catch {
    // Preserve anything that no longer exactly matches the just-created branch.
  }
}

export async function prepareWorkspace({ cwd = process.cwd(), slug, prefix = "opencode" }) {
  if (!slug) throw new WorkspaceError("prepare requires --slug <short-name>");
  const repository = await repositoryAt(cwd);
  if (repository.gitDirectory !== repository.commonDirectory) {
    throw new WorkspaceError("/implement must be launched from the repository's primary control worktree");
  }

  return withRepositoryLock(repository.commonDirectory, async () => {
    await assertClean(repository.root, "the control worktree");
    await assertNoGitOperation(repository);
    const branch = await currentBranch(repository.root);
    const remote = await configuredRemote(repository.root, branch);
    const defaultBranch = await remoteDefault(repository.root, remote);
    if (branch !== defaultBranch) {
      throw new WorkspaceError(
        "/implement must be launched from the checked-out default branch",
        `Current branch: ${branch}; remote ${remote} default: ${defaultBranch}`,
      );
    }

    const fetchUrl = canonicalRemoteUrl(
      cleanOutput(await git(repository.root, ["remote", "get-url", remote])),
      repository.root,
    );
    const pushUrls = cleanOutput(await git(repository.root, [
      "remote",
      "get-url",
      "--push",
      "--all",
      remote,
    ])).split("\n").filter(Boolean).map((value) => canonicalRemoteUrl(value, repository.root));
    if (pushUrls.length !== 1) {
      throw new WorkspaceError(
        `remote ${remote} has ${pushUrls.length} push URLs`,
        "The implementation lifecycle requires exactly one unambiguous publication endpoint.",
      );
    }
    const [pushUrl] = pushUrls;
    const latestDefaultSha = await fetchBranch(repository.root, remote, defaultBranch);
    await assertClean(repository.root, "the control worktree");
    if (await isAncestor(repository.root, branch, latestDefaultSha)) {
      const localSha = cleanOutput(await git(repository.root, ["rev-parse", "HEAD"]));
      if (localSha !== latestDefaultSha) {
        await git(repository.root, ["merge", "--ff-only", latestDefaultSha]);
        await assertClean(repository.root, "the fast-forwarded control worktree");
      }
    } else {
      const localSha = cleanOutput(await git(repository.root, ["rev-parse", "HEAD"]));
      const state = await isAncestor(repository.root, latestDefaultSha, localSha)
        ? "ahead of"
        : "diverged from";
      throw new WorkspaceError(
        `the local default branch is ${state} ${remote}/${defaultBranch}`,
        "The workflow will not rewrite, merge, or publish local default-branch history.",
      );
    }

    const baseSha = cleanOutput(await git(repository.root, ["rev-parse", "HEAD"]));
    const allocation = await allocateWorkspace(
      repository,
      repository.root,
      pushUrl,
      slug,
      prefix,
      baseSha,
    );
    try {
      await git(repository.root, [
        "worktree",
        "add",
        "--quiet",
        "--lock",
        "--reason",
        `OpenCode implementation ${allocation.sessionId}`,
        "-b",
        allocation.branch,
        allocation.worktreePath,
        baseSha,
      ]);
      const implementationRepository = await repositoryAt(allocation.worktreePath);
      const now = new Date().toISOString();
      const metadata = {
        version: 1,
        sessionId: allocation.sessionId,
        state: "active",
        branch: allocation.branch,
        worktreePath: implementationRepository.root,
        controlWorktreePath: repository.root,
        commonDirectory: repository.commonDirectory,
        remote,
        fetchUrl,
        pushUrl,
        defaultBranch,
        initialBaseSha: baseSha,
        baseSha,
        publishedSha: null,
        prUrl: null,
        evidenceTreeSha: null,
        evidenceRecordedAt: null,
        pendingOperation: null,
        createdAt: now,
        updatedAt: now,
      };
      await writeMetadata(implementationRepository.gitDirectory, metadata);
      return {
        operation: "prepare",
        sessionId: metadata.sessionId,
        worktreePath: metadata.worktreePath,
        branch: metadata.branch,
        remote: metadata.remote,
        defaultBranch: metadata.defaultBranch,
        baseSha: metadata.baseSha,
      };
    } catch (error) {
      await rollbackAllocatedWorkspace(repository.root, allocation, baseSha);
      throw error;
    }
  });
}

async function ownedSession(cwd, sessionId) {
  if (!sessionId) throw new WorkspaceError("the operation requires --session <session-id>");
  const repository = await repositoryAt(cwd);
  if (repository.gitDirectory === repository.commonDirectory) {
    throw new WorkspaceError("this operation must run from its isolated implementation worktree");
  }
  const metadata = await readMetadata(repository.gitDirectory);
  if (metadata.version !== 1 || metadata.sessionId !== sessionId) {
    throw new WorkspaceError("the session token does not own this implementation worktree");
  }
  if (metadata.pendingOperation) {
    throw new WorkspaceError(
      `the implementation has an incomplete ${metadata.pendingOperation.type} operation`,
      "Inspect the retained worktree and remote state; automatic recovery would require guessing.",
    );
  }
  if (metadata.worktreePath !== repository.root || metadata.commonDirectory !== repository.commonDirectory) {
    throw new WorkspaceError("implementation ownership metadata does not match this worktree");
  }
  if (metadata.branch === metadata.defaultBranch) {
    throw new WorkspaceError("the owned implementation branch cannot be the default branch");
  }
  const branch = await currentBranch(repository.root);
  if (branch !== metadata.branch) {
    throw new WorkspaceError(
      "the implementation worktree is on an unexpected branch",
      `Expected ${metadata.branch}; found ${branch}`,
    );
  }
  return { repository, metadata };
}

async function validateRemote(session) {
  const { repository, metadata } = session;
  const currentUrl = canonicalRemoteUrl(
    cleanOutput(await git(repository.root, ["remote", "get-url", metadata.remote])),
    metadata.controlWorktreePath,
  );
  if (currentUrl !== metadata.fetchUrl) {
    throw new WorkspaceError(
      `remote ${metadata.remote} changed during the implementation`,
      `Expected ${redactEndpoint(metadata.fetchUrl)}; found ${redactEndpoint(currentUrl)}`,
    );
  }
  const pushUrls = cleanOutput(await git(repository.root, [
    "remote",
    "get-url",
    "--push",
    "--all",
    metadata.remote,
  ])).split("\n").filter(Boolean).map((value) => canonicalRemoteUrl(
    value,
    metadata.controlWorktreePath,
  ));
  if (pushUrls.length !== 1 || pushUrls[0] !== metadata.pushUrl) {
    throw new WorkspaceError(
      `remote ${metadata.remote} publication endpoint changed during the implementation`,
      `Expected one push URL matching ${redactEndpoint(metadata.pushUrl)}; found ${pushUrls.map(redactEndpoint).join(", ") || "none"}`,
    );
  }
  const defaultBranch = await remoteDefault(repository.root, metadata.fetchUrl);
  if (defaultBranch !== metadata.defaultBranch) {
    throw new WorkspaceError(
      "the remote default branch changed during the implementation",
      `Expected ${metadata.defaultBranch}; found ${defaultBranch}`,
    );
  }
}

async function validatePublication(session) {
  const { repository, metadata } = session;
  const remoteSha = await remoteBranchSha(repository.root, metadata.pushUrl, metadata.branch);
  if (!metadata.publishedSha && remoteSha) {
    throw new WorkspaceError(
      "the implementation branch was published outside this session",
      `Publication endpoint already contains ${metadata.branch} at ${remoteSha}.`,
    );
  }
  if (metadata.publishedSha && !remoteSha) {
    throw new WorkspaceError("the published implementation branch was removed from the remote");
  }
  if (metadata.publishedSha && remoteSha !== metadata.publishedSha) {
    throw new WorkspaceError(
      "the published implementation branch changed outside this session",
      `Expected ${metadata.publishedSha}; found ${remoteSha}.`,
    );
  }
  if (remoteSha) {
    const fetchedSha = await fetchBranch(repository.root, metadata.pushUrl, metadata.branch);
    if (fetchedSha !== remoteSha) {
      throw new WorkspaceError("the published implementation branch changed while it was being inspected");
    }
    const head = cleanOutput(await git(repository.root, ["rev-parse", "HEAD"]));
    if (!await isAncestor(repository.root, remoteSha, head)) {
      throw new WorkspaceError("the local implementation branch does not contain its published history");
    }
  }
  return remoteSha;
}

async function updateMetadata(session, changes) {
  const metadata = {
    ...session.metadata,
    ...changes,
    updatedAt: new Date().toISOString(),
  };
  await writeMetadata(session.repository.gitDirectory, metadata);
  session.metadata = metadata;
}

async function synchronizeUnlocked(cwd, sessionId) {
  const session = await ownedSession(cwd, sessionId);
  const { repository, metadata } = session;
  await assertClean(repository.root, "the implementation worktree");
  await assertNoGitOperation(repository);
  await validateRemote(session);
  const remoteFeatureSha = await validatePublication(session);
  const latestDefaultSha = await fetchBranch(repository.root, metadata.fetchUrl, metadata.defaultBranch);
  const head = cleanOutput(await git(repository.root, ["rev-parse", "HEAD"]));
  const treeBefore = cleanOutput(await git(repository.root, ["rev-parse", "HEAD^{tree}"]));

  if (!await isAncestor(repository.root, metadata.baseSha, head)) {
    throw new WorkspaceError("the implementation branch no longer contains its recorded base");
  }
  if (!await isAncestor(repository.root, metadata.baseSha, latestDefaultSha)) {
    throw new WorkspaceError(
      "the remote default branch history was rewritten",
      `Recorded base ${metadata.baseSha} is not an ancestor of ${latestDefaultSha}.`,
    );
  }

  if (latestDefaultSha === metadata.baseSha || await isAncestor(repository.root, latestDefaultSha, head)) {
    if (latestDefaultSha !== metadata.baseSha) {
      await updateMetadata(session, { baseSha: latestDefaultSha });
    }
    return {
      operation: "sync",
      synchronized: true,
      strategy: latestDefaultSha === metadata.baseSha ? "unchanged" : "already-contained",
      requiresRevalidation: false,
      baseSha: latestDefaultSha,
      headSha: head,
      branch: metadata.branch,
      defaultBranch: metadata.defaultBranch,
    };
  }

  let strategy;
  if (!remoteFeatureSha) {
    const merges = cleanOutput(await git(repository.root, [
      "rev-list",
      "--merges",
      `${metadata.baseSha}..${head}`,
    ]));
    if (merges) {
      throw new WorkspaceError(
        "unpublished implementation history contains merge commits",
        "The workflow cannot prove that rewriting this history is safe.",
      );
    }
    strategy = "rebase";
  } else {
    strategy = "merge";
  }
  await updateMetadata(session, {
    pendingOperation: {
      type: "synchronization",
      strategy,
      originalHead: head,
      targetBaseSha: latestDefaultSha,
      startedAt: new Date().toISOString(),
    },
  });
  try {
    if (!remoteFeatureSha) {
      await git(repository.root, [
        "-c",
        "rebase.autoStash=false",
        "-c",
        "rebase.updateRefs=false",
        "-c",
        "rerere.enabled=false",
        "rebase",
        "--no-autostash",
        "--no-rerere-autoupdate",
        "--reapply-cherry-picks",
        "--empty=keep",
        "--onto",
        latestDefaultSha,
        metadata.baseSha,
        metadata.branch,
      ], { env: { GIT_EDITOR: "true", GIT_SEQUENCE_EDITOR: "true" } });
    } else {
      await git(repository.root, [
        "-c",
        "merge.autoStash=false",
        "-c",
        "rerere.enabled=false",
        "merge",
        "--no-edit",
        "--no-autostash",
        "--no-rerere-autoupdate",
        "--ff",
        latestDefaultSha,
      ], { env: { GIT_EDITOR: "true" } });
    }
  } catch (error) {
    let recoveryFailure = "";
    if (strategy === "rebase") {
      const abort = await git(repository.root, ["rebase", "--abort"], {
        allowedExitCodes: [0, 1, 128],
      });
      if (abort.code !== 0) recoveryFailure = abort.stderr.trim();
    } else if (strategy === "merge") {
      const abort = await git(repository.root, ["merge", "--abort"], {
        allowedExitCodes: [0, 1, 128],
      });
      if (abort.code !== 0) recoveryFailure = abort.stderr.trim();
    }
    try {
      await assertNoGitOperation(repository);
      await assertClean(repository.root, "the implementation worktree after synchronization abort");
      const restoredHead = cleanOutput(await git(repository.root, ["rev-parse", "HEAD"]));
      if (restoredHead !== head) {
        recoveryFailure = `HEAD was ${head} and is now ${restoredHead}`;
      } else {
        recoveryFailure = "";
      }
    } catch (recoveryError) {
      recoveryFailure = recoveryError.message;
    }
    if (!recoveryFailure) {
      await updateMetadata(session, { pendingOperation: null });
    }
    throw new WorkspaceError(
      recoveryFailure
        ? `could not synchronize by ${strategy}; automatic abort could not be verified`
        : `could not synchronize by ${strategy}; the operation was aborted`,
      recoveryFailure || error.message,
    );
  }

  const headSha = cleanOutput(await git(repository.root, ["rev-parse", "HEAD"]));
  const treeAfter = cleanOutput(await git(repository.root, ["rev-parse", "HEAD^{tree}"]));
  const requiresRevalidation = treeBefore !== treeAfter;
  await updateMetadata(session, {
    baseSha: latestDefaultSha,
    evidenceTreeSha: requiresRevalidation ? null : session.metadata.evidenceTreeSha,
    evidenceRecordedAt: requiresRevalidation ? null : session.metadata.evidenceRecordedAt,
    pendingOperation: null,
  });
  return {
    operation: "sync",
    synchronized: true,
    strategy,
    requiresRevalidation,
    baseSha: latestDefaultSha,
    headSha,
    branch: metadata.branch,
    defaultBranch: metadata.defaultBranch,
  };
}

export async function synchronizeWorkspace({ cwd = process.cwd(), sessionId }) {
  const initial = await ownedSession(cwd, sessionId);
  return withRepositoryLock(initial.repository.commonDirectory, () => synchronizeUnlocked(cwd, sessionId));
}

export async function recordEvidence({ cwd = process.cwd(), sessionId }) {
  const initial = await ownedSession(cwd, sessionId);
  return withRepositoryLock(initial.repository.commonDirectory, async () => {
    const session = await ownedSession(cwd, sessionId);
    await assertClean(session.repository.root, "the implementation worktree");
    await assertNoGitOperation(session.repository);
    const headSha = cleanOutput(await git(session.repository.root, ["rev-parse", "HEAD"]));
    const treeSha = cleanOutput(await git(session.repository.root, ["rev-parse", "HEAD^{tree}"]));
    const recordedAt = new Date().toISOString();
    await updateMetadata(session, {
      evidenceTreeSha: treeSha,
      evidenceRecordedAt: recordedAt,
    });
    return {
      operation: "record-evidence",
      headSha,
      treeSha,
      recordedAt,
    };
  });
}

export async function publishWorkspace({ cwd = process.cwd(), sessionId }) {
  const initial = await ownedSession(cwd, sessionId);
  return withRepositoryLock(initial.repository.commonDirectory, async () => {
    const synchronization = await synchronizeUnlocked(cwd, sessionId);
    if (synchronization.requiresRevalidation) {
      return {
        ...synchronization,
        operation: "publish",
        published: false,
        requiresEvidence: true,
      };
    }

    const session = await ownedSession(cwd, sessionId);
    const { repository, metadata } = session;
    await assertClean(repository.root, "the implementation worktree");
    const diff = await git(repository.root, ["diff", "--quiet", metadata.baseSha, "HEAD"], {
      allowedExitCodes: [0, 1],
    });
    if (diff.code === 0) throw new WorkspaceError("the implementation has no effective change to publish");

    const headSha = cleanOutput(await git(repository.root, ["rev-parse", "HEAD"]));
    const treeSha = cleanOutput(await git(repository.root, ["rev-parse", "HEAD^{tree}"]));
    if (metadata.evidenceTreeSha !== treeSha) {
      return {
        ...synchronization,
        operation: "publish",
        published: false,
        requiresEvidence: true,
        headSha,
      };
    }
    await updateMetadata(session, {
      pendingOperation: {
        type: "publication",
        headSha,
        priorPublishedSha: metadata.publishedSha,
        startedAt: new Date().toISOString(),
      },
    });
    let publicationConfirmed = false;
    try {
      await git(repository.root, [
        "push",
        "--porcelain",
        metadata.pushUrl,
        `${headSha}:refs/heads/${metadata.branch}`,
      ]);
      const publishedSha = await remoteBranchSha(
        repository.root,
        metadata.pushUrl,
        metadata.branch,
      );
      if (publishedSha !== headSha) {
        throw new WorkspaceError(
          "the publication endpoint did not retain the evidenced commit",
          `Expected ${headSha}; found ${publishedSha || "no branch"}.`,
        );
      }
      publicationConfirmed = true;
    } catch (error) {
      let observedSha;
      try {
        observedSha = await remoteBranchSha(
          repository.root,
          metadata.pushUrl,
          metadata.branch,
        );
      } catch (reconciliationError) {
        throw new WorkspaceError(
          "publication outcome is ambiguous; ownership state was retained",
          `${error.message}\nReconciliation failed: ${reconciliationError.message}`,
        );
      }
      if (observedSha === headSha) {
        publicationConfirmed = true;
      } else if (observedSha === metadata.publishedSha) {
        await updateMetadata(session, { pendingOperation: null });
        throw error;
      } else {
        throw new WorkspaceError(
          "publication outcome is ambiguous; ownership state was retained",
          `Expected ${headSha}, previous remote state ${metadata.publishedSha || "no branch"}, found ${observedSha || "no branch"}.`,
        );
      }
    }
    if (!publicationConfirmed) {
      throw new WorkspaceError("publication could not be confirmed");
    }
    await updateMetadata(session, {
      state: "published",
      publishedSha: headSha,
      pendingOperation: null,
    });
    return {
      ...synchronization,
      operation: "publish",
      published: true,
      requiresEvidence: false,
      remote: metadata.remote,
      branch: metadata.branch,
      defaultBranch: metadata.defaultBranch,
      headSha,
    };
  });
}

export async function markPullRequest({ cwd = process.cwd(), sessionId, url }) {
  if (!url || !/^https?:\/\//.test(url)) {
    throw new WorkspaceError("mark-pr requires --url <pull-request-url>");
  }
  const initial = await ownedSession(cwd, sessionId);
  return withRepositoryLock(initial.repository.commonDirectory, async () => {
    const session = await ownedSession(cwd, sessionId);
    if (!session.metadata.publishedSha) {
      throw new WorkspaceError("the implementation branch must be published before recording a pull request");
    }
    await updateMetadata(session, { state: "pr-open", prUrl: url });
    return {
      operation: "mark-pr",
      state: "pr-open",
      branch: session.metadata.branch,
      worktreePath: session.metadata.worktreePath,
      prUrl: url,
    };
  });
}

function parseOptions(args) {
  const [operation, ...rest] = args;
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new WorkspaceError(`invalid argument ${key ?? ""}`.trim());
    }
    options[key.slice(2)] = value;
  }
  return { operation, options };
}

export async function main(args = process.argv.slice(2)) {
  try {
    const { operation, options } = parseOptions(args);
    let result;
    if (operation === "prepare") {
      result = await prepareWorkspace({ slug: options.slug, prefix: options.prefix });
    } else if (operation === "sync") {
      result = await synchronizeWorkspace({ sessionId: options.session });
    } else if (operation === "publish") {
      result = await publishWorkspace({ sessionId: options.session });
    } else if (operation === "record-evidence") {
      result = await recordEvidence({ sessionId: options.session });
    } else if (operation === "mark-pr") {
      result = await markPullRequest({ sessionId: options.session, url: options.url });
    } else {
      throw new WorkspaceError(
        "expected prepare, sync, record-evidence, publish, or mark-pr",
        "Usage: implementation-workspace prepare --slug <name> [--prefix <prefix>]",
      );
    }
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    process.stderr.write(`Implementation workspace error: ${error.message}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
