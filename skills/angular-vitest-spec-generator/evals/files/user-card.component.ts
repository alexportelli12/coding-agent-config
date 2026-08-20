import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-user-card',
  standalone: true,
  template: `
    <div class="card">
      <h2>{{ userName() }}</h2>
      <p>Status: {{ status() }}</p>
      <button (click)="activate()">Activate</button>
      <button (click)="deactivate()">Deactivate</button>
    </div>
  `,
})
export class UserCardComponent {
  readonly userName = signal<string>('Unknown');
  readonly status = signal<'active' | 'inactive'>('inactive');

  activate(): void {
    this.status.set('active');
  }

  deactivate(): void {
    this.status.set('inactive');
  }

  setUserName(name: string): void {
    this.userName.set(name);
  }
}
