# State Management

Start by deciding whether a state-management abstraction is needed. Reactive
syntax alone does not make state shared, and a store should solve an ownership
or coordination problem that local state cannot.

## Choose the Smallest Scope

Use this decision order:

1. Keep transient view state in the component when one component owns it.
2. Use a feature service or local facade when several nearby consumers need
   shared behavior or dependency-injected coordination.
3. Use route- or feature-scoped state when a feature has a meaningful lifecycle
   and multiple screens share its state.
4. Use application-wide state only for genuinely cross-feature concerns with a
   clear owner and lifecycle.

Do not move state globally to make components appear simpler. Conversely, do
not duplicate state locally when multiple consumers need one canonical value.
Choose provider scope deliberately so destruction, caching, and isolation match
the feature.

## Model State

- Store mutable facts once. Derive filtered collections, counts, selection
  lookups, and flags from canonical state rather than synchronizing writable
  copies.
- Normalize collections when identity-based updates, lookup, pagination, or
  partial replacement make it useful. Keep a simple array when the feature does
  not need entity semantics.
- Keep server state, user input, navigation state, and ephemeral UI state
  distinguishable. They may share a boundary, but they do not necessarily
  share a lifecycle or refresh policy.
- Make loading, error, empty, stale, and success states part of the model when
  the UI needs to distinguish them.

## When SignalStore Is Selected

If the repository already uses NgRx SignalStore, or the task explicitly
selects it after the scope decision, use its primitives consistently with the
installed version:

- compose state, derived values, and methods according to the feature's
  responsibilities rather than creating a monolithic store;
- update state immutably through the library's supported update APIs;
- use entity helpers when the collection actually benefits from entity
  identity, and not as a default wrapper around every array;
- keep derived computations pure and use `rxMethod` or the repository's async
  primitive with an operator whose cancellation, queuing, or duplicate-
  suppression semantics match the user action;
- inject data-access dependencies at the store boundary and expose a narrow
  feature API to consumers.

SignalStore is an implementation choice, not the definition of shared state.
Do not introduce it merely because state is reactive or because a service has
more than one property.

## Async and Migration Reasoning

- Track request identity when concurrent work can complete out of order. A
  stale response must not overwrite newer intent.
- Separate state transitions from effects so success, failure, retry, and
  cleanup are understandable and testable.
- When replacing a `BehaviorSubject` service, first inventory consumers,
  synchronous reads, emissions, derived streams, and side effects. Preserve
  those semantics before choosing signals, a facade, or a store; migrate in a
  bounded feature slice rather than by pattern substitution.

Coordinate with `data-access.md` for server-state ownership and
`architecture.md` for provider and feature boundaries.
