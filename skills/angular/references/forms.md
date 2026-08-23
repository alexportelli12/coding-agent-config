# Forms

Choose a forms approach from the repository, Angular version, and feature
needs. Signal Forms can be a good fit for a repository that supports and uses
them, but Reactive Forms, template-driven forms, and established wrappers are
not globally wrong.

## Model the Form

- Define the form value separately from the transport DTO when their shapes or
  semantics differ. Make defaults, optional fields, nested values, and
  conversions explicit.
- Identify which values are user-editable, which are derived, and which are
  server-controlled. Do not bind a writable form directly to shared state or
  mutate a store object as the user types.
- Decide what happens when initial data changes while the form is dirty: reset,
  merge, ignore, or ask the user. A local editing copy, including a linked
  signal where it fits the installed API, is useful only when that policy is
  intentional.

## Validation

- Put validation at the narrowest level that owns the rule: field, group, or
  whole form. Keep cross-field and domain validation distinct from display
  concerns.
- Prefer reusable validation definitions when rules are shared or complex;
  keep a local rule local when extracting it would obscure the feature.
- Treat validation state as user behavior. Decide when errors appear, how
  server-side errors map to fields, how async validation is cancelled, and how
  messages are translated into accessible feedback. Do not rely on a boolean
  alone when pending, disabled, or server-invalid states matter.

## Submission Lifecycle

- Model submitting, success, failure, retry, and duplicate-submission behavior
  explicitly. Keep submission state separate from field validity and dirty
  state.
- Validate before mapping and submitting. Map the form value to the request
  DTO at the boundary rather than coupling controls to an API payload.
- Preserve useful user input on failure, expose actionable errors, and define
  whether a later submission supersedes or queues an earlier one.

## Choosing or Migrating APIs

- Read the local form imports, templates, helper abstractions, and tests before
  choosing Signal Forms, Reactive Forms, or another approach.
- For a new form, use the approach that best matches the feature's validation,
  dynamic-control, async, and integration needs within the installed version.
- For a migration, preserve behavior and error semantics first. A conversion
  to `form()` and `[formField]` is appropriate only when the repository version
  supports Signal Forms and the migration is part of the task; it is not a
  global cleanup rule.
- Keep form-specific logic testable at the appropriate boundary. Test the
  user's visible validation and submission behavior, not framework internals.
