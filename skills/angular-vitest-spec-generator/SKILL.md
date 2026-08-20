---
name: angular-vitest-spec-generator
description: >
  Senior Angular testing expert focused on writing fast, sustainable unit tests using Vitest.
  Use this skill whenever the user asks to generate, create, write, or update Angular unit tests,
  .spec.ts files, test suites, or testing code for Angular components, services, directives, pipes,
  or stores. Trigger when the user mentions Vitest, Karma, Jasmine, or Angular testing of any kind.
  Also trigger when converting existing tests from Karma/Jasmine to Vitest, or when testing
  signal-based components, NgRx SignalStores, or modern Angular code. Even if the user does not
  explicitly say "Vitest", use this skill for any Angular unit testing request to ensure modern,
  fast test output.
---

# Angular Vitest Spec Generator

Generate production-grade Angular unit tests using Vitest. Every spec file must use Vitest APIs exclusively. Do not use Jasmine or Karma syntax.

## Output Format

Respond with the generated spec file directly. No introduction, no explanation, no markdown code block language hints unless required by the consuming tool. No commentary about why Vitest is faster or better than Karma. Use this exact structure:

```
[filename: src/app/components/example.component.spec.ts]
[content]
```

If multiple spec files are needed, output each with the same `[filename: ...]` header.

## Vitest API Rules

### 1. Mocking & Spies

Use Vitest utilities. Never use Jasmine-specific syntax.

| Jasmine | Vitest |
|---------|--------|
| `jasmine.createSpy()` | `vi.fn()` |
| `spyOn(obj, 'method')` | `vi.spyOn(obj, 'method')` |
| `jasmine.any(String)` | `expect.any(String)` |
| `jasmine.anything()` | `expect.anything()` |
| `jasmine.objectContaining({...})` | `expect.objectContaining({...})` |

For module-level mocks, prefer `vi.mock()` at the top of the spec file. Use `vi.mocked()` to type mocked imports when needed.

```typescript
import { vi } from 'vitest';
import { SomeService } from './some.service';

vi.mock('./some.service', () => ({
  SomeService: vi.fn().mockImplementation(() => ({
    fetchData: vi.fn().mockResolvedValue([]),
  })),
}));
```

For local spies:

```typescript
const mockFetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve([]) });
vi.spyOn(window, 'fetch').mockImplementation(mockFetch);
```

### 2. Fake Timers for Async & Time-based Logic

Any code involving `setTimeout`, `setInterval`, `RxJS` delays, debounces, or throttles must use Vitest fake timers. Never rely on real delays or `waitForAsync`.

```typescript
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

it('should debounce search input', () => {
  component.onSearch('query');
  vi.advanceTimersByTime(300);
  expect(searchService.search).toHaveBeenCalledWith('query');
});
```

For async cleanup, use `vi.runAllTimersAsync()` when promises are involved:

```typescript
it('should poll until completion', async () => {
  component.startPolling();
  await vi.runAllTimersAsync();
  expect(component.status()).toBe('done');
});
```

### 3. Signal Testing

When testing signal-based components or NgRx SignalStores, read signal values by calling the signal function. Trigger change detection after state updates when the template depends on the signal.

```typescript
it('should update displayed count when signal changes', () => {
  component.increment();
  fixture.detectChanges();
  expect(component.count()).toBe(1);
  expect(fixture.nativeElement.textContent).toContain('1');
});
```

For SignalStore patches, call the store method, then assert the signal value directly:

```typescript
it('should add an item to the store', () => {
  store.addItem({ id: '1', name: 'Test' });
  expect(store.items()).toContainEqual(expect.objectContaining({ name: 'Test' }));
});
```

### 4. TestBed & Component Fixtures

Use Angular's `TestBed` with Vitest. Configure the testing module, create the component fixture, and call `detectChanges()` after setup or state mutations that affect the template.

```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [ExampleComponent],
    providers: [
      { provide: SomeService, useValue: { fetchData: vi.fn().mockResolvedValue([]) } },
    ],
  }).compileComponents();

  fixture = TestBed.createComponent(ExampleComponent);
  component = fixture.componentInstance;
});
```

### 5. Service & Pipe Tests

For services, instantiate directly or use `TestBed.inject()`. For pipes, instantiate directly unless they depend on DI.

```typescript
it('should transform value to uppercase', () => {
  const pipe = new UppercasePipe();
  expect(pipe.transform('hello')).toBe('HELLO');
});
```

## Workflow

1. **Parse intent**: Identify what is being tested (component, service, pipe, store) and what behavior matters.
2. **Read the source**: If the user provides the implementation file, read it to understand inputs, outputs, signals, methods, and dependencies.
3. **Design the test module**: Choose mocks for external dependencies. Use `vi.mock()` for modules, `useValue` / `useClass` for DI tokens.
4. **Write the spec**: Scaffold `describe`, `beforeEach`, and `it` blocks. Use fake timers for async. Assert on signal values with `()`.
5. **Verify**: Ensure no Jasmine syntax remains. Check that `vi.useFakeTimers()` and `vi.useRealTimers()` are paired. Confirm signal reads use function call syntax.

## Example

**Prompt:** "Write a Vitest spec for a component with a `count` signal and an `increment` method."

**Output:**

```
[filename: src/app/components/counter.component.spec.ts]
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CounterComponent } from './counter.component';
import { vi } from 'vitest';

describe('CounterComponent', () => {
  let component: CounterComponent;
  let fixture: ComponentFixture<CounterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should increment count', () => {
    expect(component.count()).toBe(0);
    component.increment();
    expect(component.count()).toBe(1);
  });
});
```
