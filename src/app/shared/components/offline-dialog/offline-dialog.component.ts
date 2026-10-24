import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { IconComponent } from '../icon/icon.component';

/**
 * Shown over the current screen when the connection drops (HU_07 CA4). Closing it leaves the waiter where they were,
 * with the order in progress intact. A native modal `<dialog>`: it traps focus, closes with Escape and keeps the
 * Material overlay out of the initial bundle.
 */
@Component({
  selector: 'app-offline-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, IconComponent],
  template: `
    <dialog
      #dialog
      class="offline"
      aria-labelledby="offline-title"
      aria-describedby="offline-text"
      (close)="dismissed.emit()"
    >
      <h2 id="offline-title" class="offline__title">
        <app-icon name="cloud-off" [size]="24" />
        Sin conexión
      </h2>
      <p id="offline-text" class="offline__text">
        Puedes seguir tomando pedidos. Se guardan en este dispositivo y llegan a cocina solos en
        cuanto vuelva la conexión.
      </p>
      <div class="offline__actions">
        <button
          type="button"
          mat-flat-button
          data-testid="continue-offline"
          (click)="dialog.close()"
        >
          Continuar sin conexión
        </button>
      </div>
    </dialog>
  `,
  styles: `
    .offline {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      color: var(--color-text);
      max-width: min(420px, calc(100vw - 2 * var(--space-2)));
      padding: var(--space-3);
    }

    .offline::backdrop {
      background: rgb(0 0 0 / 40%);
    }

    .offline__title {
      align-items: center;
      display: flex;
      font: var(--mat-sys-title-large);
      font-family: var(--font-family);
      gap: var(--space-1);
      margin: 0 0 var(--space-1);
    }

    .offline__text {
      font: var(--mat-sys-body-large);
      font-family: var(--font-family);
      margin: 0 0 var(--space-3);
    }

    .offline__actions {
      display: flex;
      justify-content: flex-end;
    }
  `,
})
export class OfflineDialogComponent {
  readonly open = input.required<boolean>();
  readonly dismissed = output();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) {
        dialog.showModal();
      } else if (!this.open() && dialog.open) {
        dialog.close();
      }
    });
  }
}
