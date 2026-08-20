# UI Review

Review the rendered interface, not only source code. Evaluate project-specific UX principles first, established design-system patterns second, and general UI guidance third.

## Review Process

1. Identify the user's primary journey and the change's intended outcome.
2. Read relevant project guidance and inspect the surrounding interface so local intent and conventions are understood.
3. Exercise the flow at representative viewport sizes with realistic content.
4. Inspect relevant interaction, loading, empty, error, success, selected, focus, and disabled states.
5. Use screenshots or browser inspection where practical to assess hierarchy, grouping, scanning, wrapping, and responsive composition.
6. Report only meaningful findings, ranked by user impact. Do not invent a redesign or duplicate lint and automated accessibility output.

A good review can conclude that no meaningful UI changes are needed.

## Finding Format

Each finding should include:

1. **Observation:** the evidenced behaviour or visual relationship
2. **Impact:** the effect on understanding, task completion, accessibility, or consistency
3. **Principle:** the relevant design concern
4. **Smallest fix:** the least invasive effective correction

Include a file and line reference when code identifies the source. Use severity based on user impact, frequency, and consequence, not personal taste.

Avoid "the spacing feels off" or "make it modern." Prefer "The label-to-input gap exceeds the gap between field groups, so fields no longer read as belonging to their labels; use the existing compact spacing token between each label and control."

## Rendered UI Safety Net

Use only the relevant questions. This is not a requirement to report under every heading.

### Goal And Hierarchy

- Is the user's primary goal clear?
- Is the primary action obvious without competing actions of equal weight?
- Does supporting content remain subordinate?
- Can the main structure be understood at a glance?
- Is required information visible or clearly discoverable?

### Simplicity

- Is every prominent element earning its place?
- Are unnecessary content, styles, containers, or controls competing for attention?
- Would progressive disclosure help secondary detail?
- Has visual minimalism removed anything needed for the task?

### Layout And Responsive Behaviour

- Are related elements grouped through spacing, alignment, or containment?
- Does spacing communicate the strength of relationships?
- Are actions near what they affect?
- Does hierarchy survive smaller screens with important content preserved?
- Do touch targets, wrapping, long content, intermediate widths, and realistic datasets work?
- Is desktop space used intentionally rather than filled?

### Typography, Colour, And Accessibility

- Are body text, line length, line height, and secondary text comfortable to read?
- Is the type scale coherent and are weights purposeful?
- Is contrast sufficient and does colour have a clear role?
- Is any meaning communicated by colour alone?
- Are controls, focus, and relevant interaction states distinguishable?

### Copy And Feedback

- Is the main point front-loaded in plain, concise language?
- Is terminology consistent and action-oriented?
- Do links describe their destination?
- Do empty and error states explain the situation and next useful action?

### Actions And Forms

- Is action hierarchy clear and are labels specific?
- Are targets practical and destructive-action safeguards proportional?
- Are disabled states necessary and understandable?
- Are unnecessary fields removed and labels persistent?
- Is requiredness clear, control choice conventional, and validation timely?
- Can users recover from errors without losing work?

### Consistency

- Does the implementation reuse existing components, tokens, terms, and behaviour?
- Do similar things look and behave similarly?
- Was a new pattern introduced without a requirement the existing system could not meet?
- Does the interaction follow relevant platform conventions?
