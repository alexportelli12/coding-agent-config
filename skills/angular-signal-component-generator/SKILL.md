---
name: angular-signal-component-generator
description: >
  Expert Angular architect for scaffolding modern, signal-first standalone components.
  Use this skill whenever the user asks to generate, create, scaffold, or refactor an Angular component,
  especially when they mention signals, reactive state, OnPush, standalone components, or modern Angular.
  Also use when the user wants to convert legacy Angular code (using @Input, @Output, @ViewChild, *ngIf, *ngFor)
  to the modern signal-based API. Trigger even if the user does not explicitly say "Angular" but describes
  building a UI component with TypeScript and HTML in an Angular context. Always output raw TypeScript and HTML
  without introductory filler.
---

# Angular Signal Component Generator

Generate production-grade Angular components using the modern signal-based API. Every component must be OnPush-optimized and free of legacy decorator APIs. Standalone is the default in modern Angular — do not add `standalone: true`.

## Output Format

Respond with the generated files directly. No introduction, no explanation, no markdown code block language hints unless required by the consuming tool. Use this exact structure:

```
[filename: src/app/components/example.component.ts]
[content]

[filename: src/app/components/example.component.html]
[content]
```

If styles are requested, add `[filename: src/app/components/example.component.css]` (or `.scss`).

If the user asks for a single file, output only that file.

## Architectural Rules

### 1. OnPush by Default

Set `changeDetection: ChangeDetectionStrategy.OnPush` on every component. Omit `standalone: true` — it is the default in modern Angular and adding it is redundant.

```typescript
@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './example.component.html',
})
export class ExampleComponent { }
```

### 2. Signal-Based API Only

Never use legacy decorators. Use these modern equivalents exclusively:

| Legacy | Modern |
|--------|--------|
| `@Input()` | `input<T>()` or `input.required<T>()` |
| `@Output()` | `output<T>()` |
| `@ViewChild()` | `viewChild<T>()` or `viewChild.required<T>()` |
| Two-way `@Input() + @Output()` | `model<T>()` |

Examples:

```typescript
readonly userId = input.required<string>();
readonly showDetails = input<boolean>(false);
readonly selected = model<boolean>(false);
readonly save = output<void>();
readonly formContainer = viewChild.required<ElementRef<HTMLFormElement>>('formRef');
```

### 3. Template Control Flow

Use built-in control flow syntax. Strip all structural directives.

- `@if` instead of `*ngIf`
- `@for ... track $index` (or unique id) instead of `*ngFor`
- `@switch` instead of `*ngSwitch`

```html
@if (items().length > 0) {
  <ul>
    @for (item of items(); track item.id) {
      <li>{{ item.name }}</li>
    }
  </ul>
} @else {
  <p>No items found.</p>
}
```

### 4. Unidirectional Data Flow & Derived State

- Store mutable state in `signal<T>()`.
- Derive read-only state with `computed(() => ...)`.
- Never mutate signals inside `computed()`.
- Pass data down via inputs. Emit events up via outputs. Do not let child components directly mutate parent state.

```typescript
readonly items = signal<Item[]>([]);
readonly itemCount = computed(() => this.items().length);
readonly hasItems = computed(() => this.itemCount() > 0);
```

### 5. Effect Usage

`effect()` is forbidden for state mutations or business logic. Use it only for:
- Synchronizing DOM state that signals cannot express directly
- Integrating with external non-reactive systems (e.g., imperative chart libraries, localStorage writes after signal changes)

If the component does not need DOM sync or external integration, do not include `effect()`.

### 6. Type Safety & Maintainability

- Explicitly type all inputs, outputs, signals, and computed values. Do not rely on inference where ambiguity is possible.
- Use `readonly` for all signal-based properties to prevent accidental reassignment.
- Keep components small. Extract complex logic into pure utility functions or services.
- Use strong TypeScript types; avoid `any`. If types are unknown, define an interface.

## Workflow

1. **Parse intent**: Identify component name, inputs, outputs, state, and template structure from the user prompt.
2. **Design signals**: Choose `input`, `output`, `model`, `signal`, `computed`. No legacy decorators.
3. **Write TypeScript**: Scaffold the class with OnPush, imports, and signal-based API.
4. **Write Template**: Use built-in control flow. Bind to signals with `()` — e.g., `{{ count() }}`, `[disabled]="isSubmitting()"`.
5. **Verify**: Check for any legacy decorators or structural directives. Remove them immediately.

## Example

**Prompt:** "Create a todo list component with an add button. It takes todos as input and emits delete events."

**Output:**

```
[filename: src/app/components/todo-list.component.ts]
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

export interface Todo {
  id: string;
  text: string;
}

@Component({
  selector: 'app-todo-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo-list.component.html',
})
export class TodoListComponent {
  readonly todos = input.required<Todo[]>();
  readonly deleteTodo = output<string>();
}

[filename: src/app/components/todo-list.component.html]
@if (todos().length > 0) {
  <ul>
    @for (todo of todos(); track todo.id) {
      <li>
        {{ todo.text }}
        <button type="button" (click)="deleteTodo.emit(todo.id)">Delete</button>
      </li>
    }
  </ul>
} @else {
  <p>No todos yet.</p>
}
```
