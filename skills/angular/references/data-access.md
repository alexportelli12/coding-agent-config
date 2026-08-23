# Data Access

Treat server state, request lifecycle, and view state as related but distinct
design concerns. Select the repository's established data-access boundary
before selecting an Angular API.

## Ownership

- Establish where API calls belong: an existing service, repository, facade,
  resource, route resolver, feature store, or another local abstraction.
  Components should not become accidental owners of shared server state or
  transport policy.
- Avoid duplicating server data in several writable locations. Keep a clear
  owner for caching, refresh, invalidation, optimistic updates, and error
  interpretation.
- Keep transport mapping and HTTP-specific concerns at the data boundary. Let
  feature code consume a useful domain shape when the repository's architecture
  supports that separation.

## Choosing an API

- A Resource API such as `httpResource` or `rxResource` can fit declarative,
  signal-oriented reads when the installed Angular version supports it and the
  repository uses it. Its request, value, loading, error, reload, and
  cancellation semantics should match the feature.
- `HttpClient` with RxJS remains appropriate for streams, interceptors,
  application-wide services, complex composition, mutations, or a repository
  abstraction built around observables. Do not rewrite it merely because a
  Resource API exists.
- Choose the smallest abstraction that gives the feature the required
  lifecycle, test boundary, caching, and concurrency behavior. Avoid manual
  request state when the selected abstraction already owns it, but do not hide
  important mutation semantics behind a read-oriented API.

## Request Lifecycle

- Define initial loading, refresh with stale data, empty success, recoverable
  error, retry, and successful data states. Decide which state the UI should
  show for each rather than collapsing everything into one `loading` flag.
- Derive request parameters from the actual feature inputs. Do not issue a
  request until required parameters are valid, and ensure parameter changes
  cannot leave stale results associated with the wrong identity.
- Choose concurrency from user intent: cancel stale searches, ignore duplicate
  submissions, queue ordered work, or allow independent requests. With RxJS,
  the operator is part of the behavior (`switchMap`, `exhaustMap`, or
  `concatMap` are not interchangeable); use the equivalent semantics of the
  selected API.
- Keep subscriptions and teardown at a lifecycle-aware boundary. Avoid a
  component subscription when a declarative binding or existing service
  abstraction expresses the behavior better, while allowing imperative
  subscriptions where an event-driven side effect genuinely requires one.

## Errors and Derived Data

- Preserve the original error context at the boundary, then map it to the
  user-facing or domain-facing form at the appropriate layer. Support retry
  and recovery without losing valid stale data unless the product requires it.
- Derive presentation data from the canonical response rather than storing
  duplicate filtered or counted arrays. If transformation is expensive or
  shared, place it in the established feature/data boundary and test it there.

The useful question is not "which Angular fetch API is newest?" It is "which
existing boundary can own this request and express its lifecycle correctly for
this feature?"
