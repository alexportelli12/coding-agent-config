---
name: implement-review
description: The independent review gate, review remediation and the follow-up path of /wettaq. Load it when a wettaq run reaches a code-reviewer pass, or when a request continues an existing pull request. Do not load it for runs that skip review.
metadata:
  why: "A review only helps if its findings are fixed and confirmed once, not argued over in an endless loop."
  group: run
---

# Implementation Review And Follow-Up

These stages of `/wettaq` run only when a review does, or when work continues an
existing pull request, so they are loaded on demand rather than with the
command. `/wettaq` owns everything before and after them.

## Independent Review

Invoke `code-reviewer` in `discovery` mode. Run rendered QA first when
applicable.

1. Write a background file in `evidenceDir`, within 8,000 characters: the
   request's purpose, resolved requirements and acceptance criteria, relevant
   repository and UX principles and constraints, and, for confirmation, the
   accepted findings and fixes. Never include implementation transcripts,
   reasoning, self-review, or advocacy.
2. Invoke `code-reviewer` with the worktree, the review target (workspace
   changes against HEAD before the first commit, the branch range once fully
   committed, or only the new changes on follow-up), the background file path,
   verification status, rendered QA evidence, and the review tool: the
   `reviewTool` that `ibni info --session "<sessionId>"` prints (`ocr` or
   `none`). The reviewer owns the selection mechanics.
3. With `ocr`, if the reviewer reports relevant tests or specs excluded from
   its selection, add narrowly scoped `include` rules to the repository's
   `.opencodereview/rule.json`, preserving existing rules, rerun the verify
   command (`verifyCommand`), and invoke the reviewer again. A run halted for
   coverage is not a review pass. With `none` there are no OCR rules to change.

If OCR delegation or rule resolution fails, the review gate is not clear;
report the failure.

The reviewer's latest door and blast-radius call becomes the pull request's
**Merge call**, in plain words (`commit-pr-writing` says how). A pull request
whose review is still blocked is not delivered, so the description never
carries a verdict that only the review comments explain.

## Review Remediation

Investigate every finding with repository evidence; resolve it with a bounded
fix or by establishing that it does not apply. Do not blindly accept subjective
or out-of-scope findings. Fix a finding about tests with `test-design`, and see
each new or rewritten test fail as it says.

Fix what the reviewer's rubric proves, and no more:

- A verified `blocker` or `major` is fixed in this run. One without its proof
  (an input, a call path or a failing test) counts as `minor`.
- A `minor` or `nit` is fixed only when it sits on lines this run already
  changed.
- Everything else goes under **Left for later** in the pull request, one line
  each.
- **Loop breaker:** when review asks to rewrite lines a review fix already
  rewrote, stop fixing them. Put both findings and both diffs in the pull
  request for the person to decide.

Keep a concise finding ledger in session context only: each finding's
severity, proof and disposition, and the remediation for each blocker or major.

If discovery has no verified blocker or major, make any fixes on changed
lines, rerun the verify command, and the gate is complete. Otherwise, batch the
fixes (delegate only when specialist expertise helps, never to the reviewer),
rerun the verify command, refresh rendered evidence when UI is
affected, and invoke the same reviewer once in `confirmation` mode with the
original requirements, the ledger, a concise remediation summary, the current
diff, verification status, and rendered evidence.

Confirmation checks that each fixed blocker and major is resolved and that the
fixes caused no material harm; it is not another discovery. A confirmation
finding blocks only when it is an unresolved original blocker or major, a
material regression caused or exposed by remediation, a correctness or safety
issue, or a genuine failure of the task requirements. A qualifying blocker at confirmation stops the run:
report it to the user with the finding ledger and verification evidence, and do
not deliver. There are at most two reviewer passes: discovery and
confirmation.

## Review Refresh After Integration

When `publish` reports stale evidence (`requiresRevalidation`), refresh review
only where the upstream change could materially affect it. A review refresh is
the `confirmation` pass; if that pass is already spent, stop and report
instead.

## Follow-Up On An Existing Pull Request

When this session already owns a retained `worktreePath`, `sessionId`, and
pull-request URL, reuse that workspace instead of running `prepare`. When it
does not (a new session, or one that lost the earlier session's id), run
`ibni adopt --pr "<pr-url>"` instead of `prepare`. Adopt proves the pull
request is open and that its head branch and commit match the workspace's
recorded branch, publication, remote branch and clean local HEAD, then issues a
new `sessionId`; record its result as you would `prepare`'s. Ownership moves:
the previous session's id stops working. If adopt refuses, report its
diagnostic and stop; never infer ownership of a retained worktree any other
way. Then run `ibni sync --session "<sessionId>"` before changing anything,
refresh the contract for the new request, and establish a green baseline by
running the verify command (`ibni verify`; `prepare`'s baseline citation
applies only to a fresh workspace). `adopt` reports `dependencies` and
`verified` without acting on them: when `dependencies.current` is not true,
follow its `nextAction` (usually `ibni setup`) before the baseline. A workspace
from before ibni recorded setup reports `current: null`; run `ibni setup` when
its lockfile may have changed. Then follow the normal gates of `/wettaq` through delivery;
publication updates the existing branch and `mark-pr` records the same URL
again. Rewrite the description for the whole pull request as it now stands,
with a current merge call, rather than appending a follow-up section.
