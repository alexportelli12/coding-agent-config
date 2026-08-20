# Forms

## Prefer A Clear Path

A single-column form gives the eye, keyboard, and error flow a predictable direction. Use multiple columns only when field relationships clearly benefit and responsive order remains unambiguous.

## Minimise Fields

Every field adds effort, errors, and abandonment risk. Ask whether each value is required at this point in the journey. Do not collect information merely because it may be useful later.

Use defaults and known data carefully. Do not preselect consequential consent or hide assumptions that users need to review.

## Associate Labels And Requirements

Use persistent labels, usually above controls, and keep them close enough that the relationship is obvious. Placeholder text may provide an example but does not replace a label.

Make requiredness unambiguous using the project's convention. Ensure required or optional meaning does not depend on colour alone and is announced accessibly.

Where practical, let field width suggest expected input length without breaking responsive consistency or target comfort.

## Choose Conventional Controls

Match the control to the decision:

- visible radio buttons for a small set where comparison matters
- autocomplete for long searchable sets
- steppers when incremental numeric adjustment is natural
- checkbox or switch according to meaning and the existing design system
- native or established date, time, and file controls where they reduce risk

Do not use a dropdown as the default for every selection. Preserve semantic HTML, keyboard operation, labels, and accessible state when custom controls are genuinely needed.

## Group And Split Deliberately

Use headings and spacing to group related fields. Avoid cards inside cards when hierarchy alone is sufficient.

Split genuinely long forms into coherent stages when this reduces cognitive load or mistakes. Show progress and preserve entered data. Do not create a wizard for a short form simply to produce sparse screens.

## Time Validation To Help

Choose validation timing by input and task:

- submit validation is predictable and avoids premature interruption
- blur validation can help once a user has completed a field
- live validation suits criteria or checks where immediate feedback genuinely helps

Do not show an error while a valid value is still being typed. Clear corrected errors promptly.

Associate messages with fields, explain how to recover, preserve entered values, and move or announce focus appropriately after failed submission. Provide a clear error summary for longer forms when it helps users locate problems.

## Keep Submission Understandable

Use a specific action label. Provide visible progress for meaningful waits, prevent accidental duplicate submission without creating a dead end, and make success or failure unambiguous.

For severe or irreversible consequences, apply proportionate confirmation rather than adding friction to every form.
