---
name: angular-resource-api-fetcher
description: >
  Angular data fetching using the modern Resource API (httpResource / rxResource).
  Use this skill whenever the user asks for Angular HTTP data fetching, replacing
  HttpClient subscriptions, modern reactive data patterns, or loading/error state
  management in components. Trigger even if the user does not explicitly say
  "Resource API" — any request involving Angular network requests, API calls,
  or data retrieval in components should use this skill. Also use when the user
  wants to refactor RxJS-based services or manual HttpClient calls into a signal-driven,
  declarative approach.
compatibility:
  - Angular >= 19
  - @angular/core/rxjs-interop
---

# Angular Resource API Fetcher

This skill generates production-ready Angular components and services that fetch data
using `httpResource` or `rxResource` from `@angular/core/rxjs-interop`. It replaces
legacy `HttpClient` subscriptions and complex RxJS pipelines with a declarative,
signal-based pattern.

## Core Rules

1. **Resource API Only**
   - Use `httpResource()` for standard REST calls.
   - Use `rxResource()` only when an RxJS pipeline (e.g., `switchMap`, debounce,
     custom operators) is genuinely required and cannot be expressed with
     `httpResource`.
   - Do NOT inject `HttpClient` directly into components or call `.subscribe()`
     on HTTP requests inside component classes.

2. **Reactive Parameters**
   - Map request parameters (URL segments, query params, route IDs) using a
     reactive lambda function: `request: () => ({ url: '...', params: { ... } })`.
   - Use Angular signals (`input`, `model`, `computed`) inside the lambda so the
     resource re-fetches automatically when inputs change.

3. **Execution Control**
   - If required parameters are missing (e.g., an ID signal is `null` or empty),
     return `undefined` from the `request` lambda.
   - This prevents premature or invalid network requests.

4. **Template Integration**
   - Drive UI state exclusively with the resource's built-in signals:
     `value()`, `isLoading()`, `error()`.
   - Do NOT create auxiliary boolean flags (`loading = true`) or separate error
     strings in the component class.
   - Use `@if`, `@else`, `@for`, and `@switch` in the template to react to these
     signals.

5. **Output Format**
   - Provide exact TypeScript component/service code and corresponding HTML template.
   - Do NOT include introductory filler, sales pitches, or explanations about why
     the Resource API is good. Just output the working code.
   - If the user asks for a service, export a plain function or class that returns
     a resource. If the user asks for a component, include both the `.ts` and `.html`
     snippets (or a single inline template if trivial).

## Typical Patterns

### Basic GET with route param

```typescript
import { Component, input } from '@angular/core';
import { httpResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent {
  readonly userId = input.required<string>();

  readonly userResource = httpResource(() => {
    const id = this.userId();
    if (!id) return undefined;
    return { url: `/api/users/${id}` };
  });
}
```

```html
@if (userResource.isLoading()) {
  <p>Loading…</p>
} @else if (userResource.error()) {
  <p>Error loading user.</p>
} @else {
  <div>
    <h1>{{ userResource.value()?.name }}</h1>
    <p>{{ userResource.value()?.email }}</p>
  </div>
}
```

### GET with query parameters

```typescript
readonly searchQuery = model('');

readonly resultsResource = httpResource(() => {
  const q = this.searchQuery().trim();
  if (!q) return undefined;
  return {
    url: '/api/search',
    params: { q },
  };
});
```

### POST / mutation helper (using rxResource when side-effects matter)

If the user explicitly needs to trigger a mutation (POST/PUT/DELETE) and observe
its result, use `rxResource` with a manual `reload()` trigger or an external
signal that changes:

```typescript
import { Component, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

@Component({ ... })
export class SaveComponent {
  private readonly api = inject(ApiService); // thin wrapper if needed

  readonly payload = signal<Payload | null>(null);

  readonly saveResource = rxResource({
    request: () => this.payload(),
    loader: ({ request }) => {
      if (!request) return of(undefined);
      return this.api.save(request);
    },
  });

  triggerSave(data: Payload) {
    this.payload.set(data);
  }
}
```

## Service Extraction

When the user asks for a reusable service, keep it minimal:

```typescript
import { signal, Signal } from '@angular/core';
import { httpResource } from '@angular/core/rxjs-interop';

export function createUserResource(userId: Signal<string | null>) {
  return httpResource(() => {
    const id = userId();
    if (!id) return undefined;
    return { url: `/api/users/${id}` };
  });
}
```

## Edge Cases

- **Empty or invalid IDs / query strings:** return `undefined` from `request`.
- **Polling / refresh:** use a `reload()` signal or `Resource#reload()`; do not
  create a manual `setInterval` + `HttpClient` combo.
- **Pagination:** encode page / limit as signals and reference them in the
  `request` lambda so the resource auto-refetches.
- **Error handling in templates:** use `error()` signal; do not catch the error
  in the component class to store it in a separate property.
