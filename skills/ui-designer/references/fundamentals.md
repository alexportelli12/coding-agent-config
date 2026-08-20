# UI Fundamentals

Use these principles to reason through cross-cutting interface decisions. They are prompts for judgement, not rules to enforce without context.

## Minimise Usability Risk

Treat ambiguity as design risk. Prefer the option that more people can recognise, understand, and operate without prior knowledge.

Ask whether someone could miss or misunderstand an action, label, status, or important piece of information. Check whether meaning depends entirely on an icon, colour, gesture, hover, or unusual visual treatment. Consider lower vision, reduced dexterity, lower technical literacy, and cognitive difficulty.

Familiar usually beats clever. Novelty can be worthwhile, but its benefit should justify the learning and accessibility cost.

## Give Decisions A Reason

Every prominent element or treatment should serve at least one purpose:

- hierarchy or grouping
- readability or comprehension
- discoverability or feedback
- accessibility
- interaction efficiency
- intentional brand expression

Do not add UI because data exists, space is empty, or a pattern looks current. Decoration is legitimate when it supports the product's expression without competing with the task.

## Minimise Interaction Cost

Interaction cost includes scrolling, searching, reading, remembering, typing, waiting, navigating, interpreting, and clicking.

Reduce unnecessary steps, context switches, repeated entry, eye travel, and decisions. Put actions near what they affect, provide sensible defaults when evidence supports them, and keep targets comfortably actionable.

Do not blindly minimise clicks. An extra step can reduce cognitive load, expose needed context, or add proportionate protection to a dangerous action.

## Minimise Cognitive Load

Leave the user's attention available for the task. Group related information, create obvious hierarchy, use familiar patterns, keep similar behaviour consistent, reduce unnecessary choice, and progressively reveal genuinely secondary detail.

Do not make users remember information from another screen or decode the interface's structure.

## Build Accessibility Into Decisions

Consider accessibility while choosing semantics, controls, labels, contrast, text treatment, focus behaviour, target size, errors, responsive behaviour, and interaction patterns. Do not defer it to polish or trade it for a cleaner screenshot.

Use dedicated accessibility standards and project tooling for exact compliance. This guidance informs design decisions rather than duplicating those tools.

## Prefer Systems And Familiar Patterns

Inspect existing components, tokens, styles, terminology, and usage rules before adding a colour, spacing value, variant, container, form control, or interaction.

A small coherent system is easier to learn and maintain than a collection of individually reasonable exceptions. Similar things should look and behave similarly; meaningfully different things should remain distinguishable.

Follow platform conventions unless product intent gives a sound reason not to.

## Make States Obvious

Account for the states relevant to the interaction, which may include:

- default, hover, active, and focus
- loading and empty
- selected or expanded
- error, warning, and success
- disabled, when genuinely needed

Feedback should be timely and should not rely on colour alone. Preserve layout stability and task context where possible during state changes.

## Prioritise Impact

Concentrate design effort on common, important journeys and issues with meaningful consequences. Edge cases still need to work, but rare scenarios should not dictate the whole interface unless their risk justifies it.

Prefer the smallest change that resolves the observed user problem. Do not invent a redesign around a local issue.
