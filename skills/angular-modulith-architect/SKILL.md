---
name: angular-modulith-architect
description: >
  Lead Frontend Architect enforcing Vertical Slice Architecture and strict modular boundaries in Angular workspaces.
  Use this skill whenever the user asks to structure, organize, review, or refactor an Angular workspace into domains,
  modules, or vertical slices. Trigger on phrases like "modulith", "vertical slice", "domain-driven", "module boundaries",
  "workspace architecture", "organize Angular app", "feature modules", "shared modules", or when the user wants to
  split a monolithic Angular app into cohesive domains. Also trigger when reviewing imports, dependencies, or folder
  structure for architectural compliance. Always output CLI commands and structural code without sales pitch.
---

# Angular Modulith Architect

Enforce Vertical Slice Architecture with strict modular boundaries in Angular workspaces. Organize code into explicit domains. Categorize modules into `feature`, `ui`, `data`, and `util`. Enforce dependency direction. Hide implementation details behind public API barrel files.

## Domain & Module Types

Every domain lives under `src/app/domains/<domain-name>/` and contains up to four module types:

| Type | Purpose | Example |
|------|---------|---------|
| `feature` | Smart components, pages, routing | `domains/billing/feature-payment-page/` |
| `ui` | Presentational (dumb) components | `domains/billing/ui-payment-form/` |
| `data` | Services, state management, API adapters | `domains/billing/data-payment-api/` |
| `util` | Pure functions, helpers, validators | `domains/billing/util-currency/` |

The global `shared` domain follows the same four-layer structure for cross-cutting concerns:

```
src/app/domains/shared/
  feature-shell/
  ui-layout/
  data-http/
  util-logger/
```

## Dependency Rules

These rules are absolute. Never suggest or allow violations.

1. **Domain isolation**: A domain may import only from its own internal modules or from the `shared` domain. No direct imports between non-shared domains.
2. **Layer direction**: Within a domain, modules may depend only on layers **below** them:
   - `feature` → `ui`, `data`, `util`
   - `ui` → `data`, `util`
   - `data` → `util`
   - `util` → nothing
3. **No circular dependencies** between any two modules.

## Encapsulation & Public API

Every module is a black box. Internal implementation lives in an `internal/` folder. The only surface exposed to the rest of the workspace is the barrel file at the module root.

### Required structure per module

```
domains/<domain>/<type>-<name>/
  internal/
    service.ts
    component.ts
    helpers.ts
  index.ts        <-- public API barrel file
  ...
```

### Barrel file contract

`index.ts` must export only public contracts: facades, entry components, public interfaces, and tokens. Never export from `internal/`.

```typescript
// domains/billing/data-payment-api/index.ts
export { PaymentApiService } from './internal/payment-api.service';
export { Payment } from './internal/payment.model';
export { PAYMENT_API_URL } from './internal/payment-api.config';
```

### tsconfig path mappings

Add a path alias per module so consumers import through the contract, never via relative paths into another domain.

```json
{
  "compilerOptions": {
    "paths": {
      "@app/billing/feature-payment": ["src/app/domains/billing/feature-payment-page/index.ts"],
      "@app/billing/ui-payment-form": ["src/app/domains/billing/ui-payment-form/index.ts"],
      "@app/billing/data-payment-api": ["src/app/domains/billing/data-payment-api/index.ts"],
      "@app/billing/util-currency": ["src/app/domains/billing/util-currency/index.ts"],
      "@app/shared/ui-layout": ["src/app/domains/shared/ui-layout/index.ts"]
    }
  }
}
```

## Generation Workflow

When the user asks to scaffold a domain or module:

1. **Select domain and type**. Confirm the domain name and module type.
2. **Create the folder and `internal/`**.
3. **Write the barrel file** exporting only the public contract.
4. **Add the `tsconfig.json` path alias**.
5. **Provide the Angular CLI command** (or file creation command) used.
6. **If generating components**: delegate to the `angular-signal-component-generator` skill for the component code itself, then place the output inside the module's `internal/` folder and re-export from `index.ts`.

### Example: scaffold a new `billing` domain

```bash
# Feature module
mkdir -p src/app/domains/billing/feature-payment-page/internal
touch src/app/domains/billing/feature-payment-page/index.ts

# UI module
mkdir -p src/app/domains/billing/ui-payment-form/internal
touch src/app/domains/billing/ui-payment-form/index.ts

# Data module
mkdir -p src/app/domains/billing/data-payment-api/internal
touch src/app/domains/billing/data-payment-api/index.ts

# Util module
mkdir -p src/app/domains/billing/util-currency/internal
touch src/app/domains/billing/util-currency/index.ts
```

Update `tsconfig.json` with the four new aliases.

## Review Workflow

When the user asks to review workspace architecture:

1. **Read `tsconfig.json`** to extract path mappings and module boundaries.
2. **Scan imports** in `.ts` files. Flag any import that:
   - Reaches into another domain's `internal/` folder.
   - Imports from a non-shared domain that is not the current domain.
   - Points upward in the layer stack (e.g., `data` importing `feature`).
3. **Check barrel files** to ensure nothing from `internal/` is re-exported accidentally.
4. **Report violations** with file path, offending import, and the rule broken.

### Example violation report

```
VIOLATION: src/app/domains/billing/feature-payment-page/internal/payment-page.component.ts
  Import: import { UserApiService } from '@app/user/data-user-api';
  Rule: Domain isolation — billing must not import from user (only shared or self).
```

## Coordination with Component Generator

If the user requests a component inside a module:

1. Use this skill to determine the correct domain, type, and `internal/` path.
2. Invoke the `angular-signal-component-generator` skill to produce the component code.
3. Place the generated component files inside the module's `internal/` directory.
4. Update the module's `index.ts` to export the component if it is part of the public contract.

Never let the component generator decide folder placement; that is the architect's responsibility.

## Example Output Format

When generating or reviewing, respond with the exact commands and file contents. No introduction, no justification.

```
[command]
mkdir -p src/app/domains/inventory/feature-stock-list/internal

[file: src/app/domains/inventory/feature-stock-list/index.ts]
export { StockListPageComponent } from './internal/stock-list-page.component';
export { stockListRoutes } from './internal/stock-list.routes';

[file: tsconfig.json]
"@app/inventory/feature-stock-list": ["src/app/domains/inventory/feature-stock-list/index.ts"]
```

## Reminders

- Do not use NX-specific commands or `project.json` files. This skill targets standard Angular CLI or generic monorepo workspaces.
- Always enforce the four module types and the layer direction.
- Always hide implementation behind `internal/` and expose only via `index.ts`.
- Never write a sales pitch or persuasive text about the benefits of this architecture.
