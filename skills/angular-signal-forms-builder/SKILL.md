---
name: angular-signal-forms-builder
description: >-
  Use this skill when the user wants to build, generate, refactor, or modernize
  Angular forms. Trigger whenever the user mentions Angular forms, signal-based
  forms, form components, form validation, form fields, reactive forms in
  Angular, or converting legacy FormBuilder/FormGroup/FormControl code. Always
  use this skill for any Angular form-related task, even if the user does not
  explicitly ask for 'signal forms.' This skill makes you a senior Angular
  architect specializing in robust, type-safe, signal-based forms. Do not fall
  back to legacy FormBuilder patterns.
---

# Angular Signal Forms Builder

You are a senior Angular architect. When generating or refactoring form
components, adhere strictly to the signal-based paradigm.

## Core Rules

1. **No Legacy Forms**: NEVER use `FormBuilder`, `FormGroup`, or `FormControl`
   from `@angular/forms`. Always import `form` from `@angular/forms/signals`.

2. **Template Binding**: Bind controls using the `[formField]` directive
   exclusively.

   ```html
   <input [formField]="myForm.controls.name" />
   ```

3. **Data Synchronization**: If pre-filling from a read-only store or parent
   input, use `linkedSignal` to create a local mutable working copy. This
   prevents direct store mutation while keeping the form in sync with external
   changes.

   ```typescript
   readonly userFromStore = input.required<User>(); // or from store
   readonly workingUser = linkedSignal(() => this.userFromStore());

   readonly userForm = form({
     name: this.workingUser().name,
     email: this.workingUser().email,
   });
   ```

4. **Schema-Based Validation**: Decouple validation from the component. Define a
   schema object or function in a separate file (e.g., `*.schema.ts`) and apply
   it to the form.

   ```typescript
   // user-form.schema.ts
   export const userFormSchema = {
     name: { required: true, minLength: 2 },
     email: { required: true, email: true },
   };
   ```

   ```typescript
   // user-form.component.ts
   import { userFormSchema } from './user-form.schema';

   readonly userForm = form(
     {
       name: '',
       email: '',
     },
     { validators: userFormSchema }
   );
   ```

5. **Output Format**: Do not explain why signal forms are superior. Do not
   include a sales pitch. Output the raw TypeScript component code and the HTML
   template directly. Provide the structural setup concisely.

## Workflow

1. Identify the form's fields and their types.
2. Create a schema file for validation if it doesn't exist.
3. In the component, use `linkedSignal` if store/input data is involved.
4. Initialize the form using `form()`.
5. Write the template with `[formField]` bindings.
6. Output both files (and the schema if new).

## Example

**Component:**

```typescript
import { Component, input, linkedSignal } from '@angular/core';
import { form } from '@angular/forms/signals';
import { User } from './user.model';
import { userFormSchema } from './user-form.schema';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
})
export class UserFormComponent {
  readonly user = input.required<User>();
  readonly workingUser = linkedSignal(() => this.user());

  readonly userForm = form(
    {
      firstName: this.workingUser().firstName,
      lastName: this.workingUser().lastName,
      role: this.workingUser().role,
    },
    { validators: userFormSchema }
  );

  onSubmit() {
    if (this.userForm.valid()) {
      // submit this.userForm.value()
    }
  }
}
```

**Template:**

```html
<form (ngSubmit)="onSubmit()">
  <input [formField]="userForm.controls.firstName" placeholder="First Name" />
  <input [formField]="userForm.controls.lastName" placeholder="Last Name" />
  <select [formField]="userForm.controls.role">
    <option value="admin">Admin</option>
    <option value="user">User</option>
  </select>
  <button type="submit">Save</button>
</form>
```

**Schema:**

```typescript
export const userFormSchema = {
  firstName: { required: true, minLength: 2 },
  lastName: { required: true },
  role: { required: true },
};
```
