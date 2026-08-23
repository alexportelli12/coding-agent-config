# Components

Design the cleanest component boundary for the feature, not the most modern
component syntax in isolation.

## Responsibility and Boundaries

- Give a component one coherent rendering and interaction responsibility. A
  route-level component may orchestrate feature work; a presentational
  component should not quietly become the owner of server state or domain
  workflows.
- Keep state near the component that owns it. Extract a child when it has a
  meaningful API, an independently understandable responsibility, useful
  reuse, or a testing boundary. Do not split a component merely to reduce its
  line count.
- Extract a pure function for deterministic transformation. Use a service when
  logic needs dependency injection, a lifecycle, shared coordination, or an
  external side effect. Avoid moving UI decisions into a service just to make a
  component look small.

## Component APIs

- Design inputs around data the parent owns and outputs around user intent or
  events the parent must handle. Keep the public API small and stable; do not
  expose a store, service, mutable collection, or implementation detail when a
  narrower contract is sufficient.
- Use the repository's established component I/O approach when extending an
  existing area. Signal inputs, outputs, models, and view queries are useful
  when supported by the installed version and local convention, but they are
  not a reason to perform an unrelated migration.
- Make two-way binding an explicit contract only when both sides genuinely
  participate in ownership. Otherwise prefer a value input and an intent
  output so data flow remains clear.
- Treat input changes, destruction, and repeated user actions as part of the
  API contract. Define what resets, persists, cancels, or is ignored.

## State and Effects

- Store only mutable facts that the component owns. Derive counts, flags,
  filtered values, and other projections from the source state instead of
  maintaining duplicate writable copies.
- Keep derived computations pure. Use effects only when synchronizing with an
  external imperative system or a lifecycle boundary that cannot be expressed
  through Angular's declarative data flow. Do not use an effect as a substitute
  for an event handler, derived state, or business workflow.
- When asynchronous work is involved, make request ownership and stale-result
  behavior explicit. A component may coordinate a request, but server-state
  ownership may belong in a data-access abstraction or feature state boundary;
  see `data-access.md` and `state-management.md`.

## Templates

- Keep templates expressive about rendering, accessibility, and user intent;
  keep complex domain calculations and transformations out of them.
- Match the repository's template control-flow and binding conventions. Do not
  mechanically replace established syntax throughout an area while changing
  one feature.
- Preserve a clear distinction between loading, empty, error, and ready views
  when the component presents asynchronous data. Test the states users can
  observe rather than private implementation details.

The useful question is: what is the smallest component API that lets this
feature express its behavior while keeping ownership and change propagation
obvious?
