# Buttons And Actions

## Establish Action Hierarchy

Use a small set of action weights:

- **Primary:** the most important action in the current decision context
- **Secondary:** important but subordinate
- **Tertiary:** lower-emphasis supporting action

Normally give one action visual dominance within a decision context. Do not style every available action as important. Multiple contexts can each have a primary action when their boundaries are clear.

## Describe The Result

Use labels that communicate what will happen. Verb and object is a useful default when natural: "Save changes", "Create account", or "Delete project" is clearer than "Submit", "Continue", or "Yes".

Keep terminology consistent with headings, navigation, confirmation, and success feedback.

## Make Targets Actionable

Follow project accessibility and platform standards for target size and separation. Roughly `48pt` square is a safe usability target, not a magic CSS value.

If the visible control is intentionally smaller, consider a larger hit area that does not overlap adjacent controls. Ensure keyboard operation and visible focus, not only touch comfort.

## Question Disabled States

A disabled primary action can create an unexplained dead end. Where appropriate, allow submission, validate, and explain what requires attention.

Disabled states remain valid when an action genuinely cannot or should not occur. Make the reason discoverable, preserve sufficient contrast to recognise the control, and do not rely on hover-only explanation.

## Match Friction To Consequence

Protect destructive actions in proportion to their impact and reversibility. Use lower initial prominence, separation from common actions, progressive disclosure, confirmation, undo, or explicit acknowledgement where appropriate.

Do not automatically make a destructive action visually dominant because danger uses red. Make the safe path clear without obscuring the destructive option when it is legitimately needed.

Avoid confirmations for harmless or readily reversible actions; repeated friction teaches users to dismiss warnings.

## Treat Icons And Text As One Control

Balance icon size, weight, spacing, and contrast with its label. Keep labels for unfamiliar or ambiguous icons. Tooltips can supplement an icon label but should not carry essential meaning or replace an accessible name.
