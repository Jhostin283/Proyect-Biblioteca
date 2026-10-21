import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type StateVariant = 'loading' | 'empty' | 'error';

/**
 * Patrón único para los estados de carga, lista vacía y error de las vistas.
 */
@Component({
  selector: 'app-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="state"
      [class]="'state state--' + variant()"
      [attr.role]="variant() === 'error' ? 'alert' : 'status'"
      [attr.aria-live]="variant() === 'error' ? 'assertive' : 'polite'"
    >
      @if (variant() === 'loading') {
        <span class="state__spinner" aria-hidden="true"></span>
      } @else {
        <span class="state__icon" aria-hidden="true">{{ variant() === 'empty' ? '◎' : '!' }}</span>
      }
      <p class="state__title">{{ title() }}</p>
      @if (message()) {
        <p class="state__message">{{ message() }}</p>
      }
      @if (actionLabel()) {
        <button type="button" class="btn btn--secondary btn--sm" (click)="action.emit()">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    .state__icon {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-surface-alt);
      border: 1px solid var(--color-border);
      font-family: var(--font-display);
      font-size: 1.25rem;
      color: var(--color-ink-faint);
    }
    .state--error .state__icon {
      color: var(--color-danger);
      border-color: #f4c7c3;
      background: var(--color-danger-soft);
    }
  `]
})
export class StateComponent {
  readonly variant = input<StateVariant>('empty');
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly actionLabel = input<string>('');
  readonly action = output<void>();
}
