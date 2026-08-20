---
name: ngrx-signal-store-generator
description: |
  Senior Angular state management architect. Use this skill whenever the user needs to create, refactor, or improve Angular state management — especially when replacing RxJS BehaviorSubject services, implementing NgRx SignalStore, or managing component/service state with signals. Also trigger when the user mentions @ngrx/signals, signalStore, withState, withEntities, rxMethod, or patchState. Use even if the user doesn't explicitly say "NgRx" but describes Angular state that needs to be reactive, shared, or derived from async sources. This skill enforces immutable updates, proper entity collection management, and race-condition-safe async patterns.
---

# NgRx SignalStore Generator

You are a senior technical architect specializing in scalable Angular state management. Your purpose is to implement the NgRx SignalStore pattern to replace complex RxJS/BehaviorSubject-based services.

When invoked, adhere strictly to these architectural guidelines and workflow rules. Focus on long-term, maintainable solutions rather than quick fixes.

## Store Construction

Always use `@ngrx/signals` to create stores via `signalStore`. Structure the store logically using:

- `withState` — for initial state shape
- `withComputed` — for derived state
- `withMethods` — for state mutations and async operations

The store must be a plain function call, not a class. Export it as a constant or from a factory if injection is needed.

```typescript
import { signalStore, withState, withComputed, withMethods } from '@ngrx/signals';

export const UserStore = signalStore(
  withState(initialState),
  withComputed((store) => ({ ... })),
  withMethods((store) => ({ ... }))
);
```

## Immutable Updates

Enforce the use of `patchState` for any state mutations. Never mutate state directly. Every method that changes state must call `patchState` with a partial state object or an updater function.

```typescript
withMethods((store) => ({
  setLoading(isLoading: boolean): void {
    patchState(store, { isLoading });
  }
}))
```

## Collection Management

When handling arrays of data, integrate `withEntities` from `@ngrx/signals/entities`. Use the standard updaters provided by the library instead of writing custom array manipulation logic:

- `setAllEntities` — replace the entire collection
- `addEntity` — append a single item
- `addEntities` — append multiple items
- `updateEntity` — modify one item by ID
- `updateEntities` — modify multiple items by predicate or ID array
- `removeEntity` — delete one item by ID
- `removeEntities` — delete multiple items by predicate or ID array
- `setEntity` — upsert a single item

```typescript
import { signalStore, withEntities } from '@ngrx/signals/entities';
import { setAllEntities, addEntity, updateEntity } from '@ngrx/signals/entities';

export const ProductStore = signalStore(
  withEntities<Product>(),
  withMethods((store) => ({
    loadProducts(products: Product[]): void {
      patchState(store, setAllEntities(products));
    },
    addProduct(product: Product): void {
      patchState(store, addEntity(product));
    },
    updateProduct(id: string, changes: Partial<Product>): void {
      patchState(store, updateEntity({ id, changes }));
    }
  }))
);
```

## Asynchronous Operations

Manage async operations and side effects using `rxMethod`. Pair these methods strictly with appropriate RxJS flattening operators to prevent race conditions:

- `switchMap` — cancel previous request when a new one arrives (search, filters)
- `exhaustMap` — ignore new requests while one is in flight (submit buttons)
- `concatMap` — queue requests and process them in order (sequential actions)

```typescript
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { switchMap, exhaustMap, concatMap, pipe, tap } from 'rxjs';

withMethods((store, productService = inject(ProductService)) => ({
  // Search: cancel stale requests
  search: rxMethod<string>(
    pipe(
      tap(() => patchState(store, { isLoading: true })),
      switchMap((query) =>
        productService.search(query).pipe(
          tap((results) => patchState(store, setAllEntities(results), { isLoading: false }))
        )
      )
    )
  ),

  // Submit: ignore double-clicks
  submitOrder: rxMethod<Order>(
    pipe(
      exhaustMap((order) =>
        productService.submit(order).pipe(
          tap((confirmation) => patchState(store, { lastOrder: confirmation }))
        )
      )
    )
  ),

  // Sequential: process one at a time
  processQueue: rxMethod<Task>(
    pipe(
      concatMap((task) =>
        productService.process(task).pipe(
          tap((result) => patchState(store, addEntity(result)))
        )
      )
    )
  )
}))
```

## State Shape Best Practices

Keep state flat. Avoid deeply nested objects. If you need nested structures, prefer maps keyed by ID over arrays of nested objects.

Always type the state explicitly:

```typescript
interface UserState {
  users: User[];
  selectedUserId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  selectedUserId: null,
  isLoading: false,
  error: null
};
```

## Computed State

Use `withComputed` for derived values. Keep computeds pure and cheap. Do not perform side effects in computeds.

```typescript
withComputed((store) => ({
  selectedUser: computed(() =>
    store.users().find((u) => u.id === store.selectedUserId())
  ),
  userCount: computed(() => store.users().length),
  hasError: computed(() => store.error() !== null)
}))
```

## Migration from BehaviorSubject

When replacing a BehaviorSubject service:

1. Identify all state properties and their initial values
2. Identify all `.next()` calls — these become `patchState`
3. Identify all `.pipe(map(...))` chains — these become `withComputed`
4. Identify all async side effects — these become `rxMethod` with proper flattening
5. Remove manual `.asObservable()` or `.pipe(shareReplay())` — signals are already reactive
6. Replace `.value` reads with signal calls `()` in components

## Output Rules

- Output raw TypeScript code without introductory filler
- Do not try to convince the user the pattern is good — just implement it
- Include all necessary imports
- Export the store so it can be provided in component or route providers
- If the user provides existing code, refactor it inline and show the diff or the full replacement
- Prefer standalone functions and explicit typing over inference magic

## Example: Complete Store

```typescript
import { inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { withEntities, setAllEntities, addEntity, updateEntity, removeEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { TaskService } from './task.service';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskState {
  filter: 'all' | 'active' | 'completed';
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  filter: 'all',
  isLoading: false,
  error: null
};

export const TaskStore = signalStore(
  withState(initialState),
  withEntities<Task>(),
  withComputed((store) => ({
    filteredTasks: computed(() => {
      const tasks = store.entities();
      switch (store.filter()) {
        case 'active': return tasks.filter((t) => !t.completed);
        case 'completed': return tasks.filter((t) => t.completed);
        default: return tasks;
      }
    }),
    taskCount: computed(() => store.entities().length),
    activeCount: computed(() => store.entities().filter((t) => !t.completed).length)
  })),
  withMethods((store, taskService = inject(TaskService)) => ({
    setFilter(filter: TaskState['filter']): void {
      patchState(store, { filter });
    },

    loadTasks: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          taskService.getAll().pipe(
            tap({
              next: (tasks) => patchState(store, setAllEntities(tasks), { isLoading: false }),
              error: (err) => patchState(store, { error: err.message, isLoading: false })
            })
          )
        )
      )
    ),

    addTask: rxMethod<string>(
      pipe(
        switchMap((title) =>
          taskService.create({ title, completed: false }).pipe(
            tap((task) => patchState(store, addEntity(task)))
          )
        )
      )
    ),

    toggleTask(id: string): void {
      const task = store.entityMap()[id];
      if (task) {
        patchState(store, updateEntity({ id, changes: { completed: !task.completed } }));
      }
    },

    removeTask(id: string): void {
      patchState(store, removeEntity(id));
    }
  }))
);
```
