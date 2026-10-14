import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from '@shared/services/toast.service';
import { IconComponent } from '../icon/icon.component';

const TOAST_ICON_SIZE = 20;
const CLOSE_ICON_SIZE = 20;

/** Renders the active toasts at the top of the screen. Mounted once, in the app shell. */
@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <article class="toast" data-testid="toast">
          <span class="toast__icon"><app-icon [name]="toast.icon" [size]="iconSize" /></span>
          <div class="toast__body">
            <h2 class="toast__title">{{ toast.title }}</h2>
            <p class="toast__message">{{ toast.message }}</p>
          </div>
          <button
            type="button"
            class="toast__close"
            aria-label="Cerrar notificación"
            (click)="toasts.dismiss(toast.id)"
          >
            <app-icon name="x" [size]="closeSize" />
          </button>
        </article>
      }
    </div>
  `,
  styles: `
    .toasts {
      display: grid;
      gap: var(--space-1);
      left: 50%;
      max-width: min(420px, calc(100vw - var(--space-4)));
      pointer-events: none;
      position: fixed;
      top: var(--space-2);
      transform: translateX(-50%);
      width: 100%;
      z-index: 1000;
    }

    .toast {
      align-items: start;
      animation: toast-in var(--duration-slow) var(--ease-standard);
      background: var(--color-surface);
      border: 1px solid var(--color-card-border);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-medium);
      display: flex;
      gap: var(--space-2);
      padding: var(--space-2);
      pointer-events: auto;
    }

    .toast__icon {
      align-items: center;
      background: var(--color-primary-tint);
      border-radius: var(--radius-pill);
      color: var(--color-primary);
      display: inline-flex;
      flex: none;
      height: var(--space-5);
      justify-content: center;
      width: var(--space-5);
    }

    .toast__body {
      flex: 1;
      min-width: 0;
    }

    .toast__title {
      font: var(--mat-sys-title-medium);
      font-family: var(--font-family);
      font-weight: 600;
      margin: 0;
    }

    .toast__message {
      color: var(--color-text-secondary);
      font: var(--mat-sys-body-medium);
      font-family: var(--font-family);
      margin: 0;
    }

    .toast__close {
      align-items: center;
      background: transparent;
      border: 0;
      border-radius: var(--radius-pill);
      color: var(--color-text-secondary);
      cursor: pointer;
      display: inline-flex;
      flex: none;
      height: var(--touch-target);
      justify-content: center;
      margin: calc(var(--space-1) * -1) calc(var(--space-1) * -1) 0 0;
      width: var(--touch-target);
    }

    @media (hover: hover) {
      .toast__close:hover {
        background: var(--color-primary-tint);
      }
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(-12px);
      }
    }
  `,
})
export class ToastHostComponent {
  protected readonly toasts = inject(ToastService);
  protected readonly iconSize = TOAST_ICON_SIZE;
  protected readonly closeSize = CLOSE_ICON_SIZE;
}
