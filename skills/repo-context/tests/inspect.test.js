"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  classifySource,
  cleanText,
  generateReport,
  redactUrl,
  scoreConvention,
} = require("../scripts/inspect.js");

function createRepo(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repo-context-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

test("classifies tests, fixtures, evals, and examples as non-production", () => {
  const root = path.join(path.sep, "repo");
  assert.equal(classifySource(root, path.join(root, "src", "app.ts")), "production");
  assert.equal(classifySource(root, path.join(root, "src", "app.spec.ts")), "non-production");
  assert.equal(classifySource(root, path.join(root, "evals", "sample.ts")), "non-production");
  assert.equal(classifySource(root, path.join(root, "examples", "sample.ts")), "non-production");
});

test("excludes eval fixtures from pattern and convention evidence", (t) => {
  const root = createRepo(t);
  write(root, "package.json", JSON.stringify({ dependencies: { "@angular/core": "^20.0.0" } }));
  write(root, "src/plain.ts", "export const value = 1;\n");
  write(
    root,
    "evals/fake.component.ts",
    "import { Component, signal } from '@angular/core'; @Component({selector: 'fake-x', template: ''}) export class Fake { value = signal(1); }",
  );

  const report = generateReport(root);
  assert.match(report, /Scanned 2 source files \(1 production, 1 non-production\)/);
  assert.doesNotMatch(report, /Angular Signals/);
  assert.doesNotMatch(report, /Selector prefix observed/);
});

test("reports package-level frameworks and the detected package manager", (t) => {
  const root = createRepo(t);
  write(root, "package.json", JSON.stringify({ private: true, workspaces: ["apps/*"] }));
  write(root, "pnpm-lock.yaml", "lockfileVersion: '9.0'\n");
  write(
    root,
    "apps/client/web/package.json",
    JSON.stringify({
      dependencies: { react: "19.0.0" },
      devDependencies: { typescript: "5.9.0", vitest: "3.2.0" },
      scripts: { build: "vite build", "test:unit": "vitest" },
    }),
  );

  const report = generateReport(root);
  assert.match(report, /Package `apps\/client\/web`/);
  assert.match(report, /React 19\.0\.0/);
  assert.match(report, /Dev tools: TypeScript 5\.9\.0, Vitest 3\.2\.0/);
  assert.match(report, /`pnpm run build`/);
  assert.match(report, /`pnpm run test:unit`/);
  assert.match(report, /Discovered package roots.*`apps\/client\/web`/);
});

test("uses per-file convention evidence and treats ties as mixed", () => {
  const pair = {
    category: "Example",
    scope: "typescript",
    a: { label: "A", re: /useA/ },
    b: { label: "B", re: /useB/ },
  };
  const source = (content) => ({
    content: `import { Component } from '@angular/core'; ${content}`,
    ext: ".ts",
    kind: "production",
    path: "/repo/source.ts",
  });
  const result = scoreConvention(pair, [source("useA"), source("useB"), source("useA useB")]);

  assert.equal(result.preferred, "No clear default");
  assert.equal(result.confidence, "mixed");
  assert.equal(result.evidence, "A: 1, B: 1, both: 1");
});

test("sanitizes Markdown control content and redacts URL secrets", () => {
  assert.equal(cleanText("unsafe\n| heading #"), "unsafe \\| heading \\#");
  assert.equal(redactUrl("https://user:secret@example.com/path?token=secret#value"), "https://example.com");
  assert.equal(redactUrl("${PLAYWRIGHT_URL}"), "configured (value redacted)");
});

test("redacts sensitive Playwright base URL details in reports", (t) => {
  const root = createRepo(t);
  write(root, "package.json", "{}");
  write(
    root,
    "playwright.config.ts",
    "export default { use: { baseURL: 'https://user:password@example.com/app?token=secret#fragment' } };",
  );

  const report = generateReport(root);
  assert.match(report, /base origin: `https:\/\/example\.com`/);
  assert.doesNotMatch(report, /password|token=secret|fragment/);
});

test("detects test frameworks, Angular builders, and colocated specs", (t) => {
  const root = createRepo(t);
  write(root, "package.json", JSON.stringify({
    devDependencies: { vitest: "3.2.0", "@playwright/test": "1.55.0" },
    scripts: { "test:node": "node --test 'src/**/*.spec.ts'" },
  }));
  write(root, "angular.json", JSON.stringify({
    projects: {
      app: {
        projectType: "application",
        sourceRoot: "src",
        targets: { test: { builder: "@angular/build:unit-test" } },
      },
    },
  }));
  write(root, "playwright.config.ts", "export default { testDir: './ui-tests' };");
  write(root, "src/app/service.spec.ts", "import test from 'node:test'; test('service', () => {});");
  write(root, "src/app/component.test.ts", "describe('component', () => {});");
  write(root, "ui-tests/home.spec.ts", "import { test } from '@playwright/test';");

  const report = generateReport(root);
  assert.match(report, /Playwright \(`playwright\.config\.ts`, test dir: `ui-tests`\), Vitest, Angular test builder `@angular\/build:unit-test`/);
  assert.match(report, /Node test runner \(1 spec\)/);
  assert.match(report, /2 colocated\/unit spec\(s\), 1 end-to-end spec\(s\)/);
});

test("reports Signal, reactive, and template-driven forms independently", (t) => {
  const root = createRepo(t);
  write(root, "package.json", JSON.stringify({ dependencies: { "@angular/core": "21.0.0", "@angular/forms": "21.0.0" } }));
  write(root, "src/signal-form.ts", "import { form } from '@angular/forms/signals'; export const profileForm = form({});");
  write(root, "src/reactive-form.ts", "import { FormControl } from '@angular/forms'; export const name = new FormControl('');");
  write(root, "src/template.component.ts", "import { Component } from '@angular/core'; @Component({ selector: 'app-template', templateUrl: './template.html' }) export class Template {}");
  write(root, "src/template.html", "<input [(ngModel)]=\"name\">");

  const report = generateReport(root);
  assert.match(report, /Signal Forms: 1 file/);
  assert.match(report, /Reactive Forms: 1 file/);
  assert.match(report, /Template-driven Forms: 1 file/);
  assert.match(report, /These approaches can coexist/);
});

test("reports architecture topology and separates Supabase support directories", (t) => {
  const root = createRepo(t);
  write(root, "package.json", JSON.stringify({ dependencies: { "@angular/core": "21.0.0", express: "5.1.0" } }));
  write(root, "angular.json", JSON.stringify({ projects: { web: { projectType: "application", sourceRoot: "src" } } }));
  write(root, "apphosting.prod.yaml", "runConfig:\n  maxInstances: 2\n");
  write(root, "src/main.ts", "import { Component } from '@angular/core'; @Component({selector: 'app-root', template: ''}) class App {}");
  write(root, "server/server.ts", "import express from 'express'; express();");
  write(root, "supabase/functions/_shared/client.ts", "export const client = {};");
  write(root, "supabase/functions/process/index.ts", "export default () => null;");

  const report = generateReport(root);
  assert.match(report, /Angular projects:\*\* `web` \(application\) at `src`/);
  assert.match(report, /Angular APIs in 1 file; Express imports in 1 file; Supabase function code in 2 files/);
  assert.match(report, /Edge functions: `process`/);
  assert.match(report, /Shared\/support directories: `_shared`/);
  assert.match(report, /`apphosting\.prod\.yaml` \(Firebase App Hosting\)/);
});

test("prioritizes useful tree areas and ignores generated test reports", (t) => {
  const root = createRepo(t);
  write(root, "package.json", "{}");
  write(root, "angular.json", "{}");
  write(root, "src/app/main.ts", "export const app = true;");
  write(root, "supabase/functions/api/index.ts", "export const api = true;");
  write(root, "playwright-report/index.html", "<h1>generated</h1>");
  write(root, "tests/home.spec.ts-snapshots/baseline.png", "generated");
  for (let index = 0; index < 20; index++) write(root, `scraping/agency-${index}/index.ts`, "export {};");

  const report = generateReport(root);
  assert.match(report, /\|-- package\.json[\s\S]*\|-- angular\.json[\s\S]*\|-- src\/[\s\S]*\|-- supabase\//);
  assert.doesNotMatch(report, /playwright-report/);
  assert.doesNotMatch(report, /spec\.ts-snapshots/);
});

test("reads GitHub Actions jobs and triggers from structured YAML", (t) => {
  try {
    require.resolve("yaml");
  } catch {
    t.skip("optional yaml parser is unavailable");
    return;
  }
  const root = createRepo(t);
  write(root, "package.json", "{}");
  write(
    root,
    ".github/workflows/ci.yml",
    "name: CI # primary\non: [push, pull_request]\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps: []\n",
  );

  const report = generateReport(root);
  assert.match(report, /CI \(`ci\.yml`\) \[push, pull\\_request\] - jobs: `validate`/);
});

test("does not follow source directory symlinks", { skip: process.platform === "win32" }, (t) => {
  const root = createRepo(t);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "repo-context-outside-"));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  write(root, "package.json", "{}");
  write(outside, "secret.ts", "export const leakedSecret = 'do-not-report';");
  fs.symlinkSync(outside, path.join(root, "src"));

  const report = generateReport(root);
  assert.doesNotMatch(report, /leakedSecret|do-not-report/);
  assert.match(report, /Scanned 0 source files/);
});

test("keeps generated reports within the line budget and closes code fences", (t) => {
  const root = createRepo(t);
  write(root, "package.json", "{}");
  for (let index = 0; index < 100; index++) {
    write(root, `src/feature-${index}/index.ts`, `export const value${index} = ${index};`);
  }

  const report = generateReport(root);
  assert.ok(report.split("\n").length <= 350);
  assert.equal((report.match(/```/g) || []).length % 2, 0);
});
