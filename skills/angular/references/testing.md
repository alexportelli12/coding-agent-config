# Testing

Test observable behavior at the smallest level that gives confidence. Use the
repository's configured test runner, assertion library, Angular test setup,
and naming conventions; do not prescribe Vitest, Jasmine, Karma, or another
runner globally.

## Select the Test Level

- Test pure transformations directly without Angular when no framework
  integration is involved.
- Test a service through its public behavior, using `TestBed` when dependency
  injection, providers, or Angular lifecycle are part of the behavior and
  direct construction when they are not.
- Use a component fixture when template rendering, bindings, change
  propagation, DOM interaction, outputs, or injected providers matter. Do not
  use a fixture to test every private calculation.
- Add a higher-level feature test when the important contract crosses several
  Angular boundaries; avoid reproducing the same assertion in every layer.

## Test Behavior and Boundaries

- Read the implementation and closest existing specs before choosing setup or
  mocks. Treat public inputs, user events, rendered states, outputs, and
  service calls at the boundary as the contract.
- Mock external systems and unstable boundaries, not the implementation under
  test. Keep test doubles small and make failure behavior explicit.
- For signal-based state, change it through the public API and assert the
  resulting value or rendered behavior. Trigger the repository's normal
  change-detection or stabilization step when the template requires it.
- Cover meaningful initial, loading, empty, error, success, retry, validation,
  and concurrency states rather than only creation and happy-path rendering.

## Async Behavior

- Use the async utilities configured by the repository and choose the tool that
  matches the behavior: Angular stabilization for rendering, observable
  assertions for streams, and a fake clock for debounce, polling, timers, or
  delayed work when the configured framework supports it.
- Pair fake-clock setup and cleanup, and avoid real sleeps. Test cancellation,
  duplicate suppression, queueing, and stale-result handling when those are
  product semantics, not merely implementation details.
- Assert both the user-visible result and important boundary interactions, such
  as the request parameters or emitted event, without asserting framework
  internals.

## Maintainability

- Prefer a small number of behavior-focused cases with clear names over broad
  snapshots or assertions on private fields.
- Keep setup local enough that each test explains its scenario. Reuse helpers
  only when they preserve that clarity.
- Follow repository test commands and deterministic validation. This reference
  supplies Angular testing judgement; it does not replace the broader project
  testing workflow.
