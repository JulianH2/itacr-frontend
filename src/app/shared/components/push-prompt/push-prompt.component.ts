import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import {
  PushNotificationsService,
  type PushTarget,
} from '@shared/services/push-notifications.service';

import { IconComponent } from '../icon/icon.component';

/**
 * Explains the "order ready" notices and asks for the permission with a tap (HU_09). Nothing is shown where notices are
 * not possible; with permission already granted it only saves this browser again for the target, quietly.
 */
@Component({
  selector: 'app-push-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, IconComponent],
  template: `
    @switch (push.permission()) {
      @case ('default') {
        <section class="push" aria-labelledby="push-title" data-testid="push-prompt">
          <app-icon class="push__icon" name="bell" [size]="24" />
          <div class="push__text">
            <h2 id="push-title" class="push__title">Avisos de pedido listo</h2>
            <p class="push__description">{{ description() }}</p>
          </div>
          <button
            type="button"
            mat-flat-button
            data-testid="enable-push"
            [disabled]="busy()"
            (click)="enable()"
          >
            Activar avisos
          </button>
        </section>
      }
      @case ('granted') {
        @if (justEnabled()) {
          <p class="push__note" role="status" data-testid="push-enabled">
            Listo: te avisaremos en este teléfono.
          </p>
        }
      }
      @case ('denied') {
        <p class="push__note" data-testid="push-denied">
          Los avisos están bloqueados en este navegador. Puedes ver aquí cómo va tu pedido.
        </p>
      }
    }
    @if (failed()) {
      <p class="push__note" role="alert" data-testid="push-failed">
        No pudimos activar los avisos. Inténtalo más tarde.
      </p>
    }
  `,
  styles: `
    .push {
      align-items: center;
      background: var(--color-secondary-tint);
      border-radius: var(--radius-card);
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      padding: var(--space-2);
    }

    .push__icon {
      color: var(--color-primary);
    }

    .push__text {
      flex: 1 1 220px;
    }

    .push__title {
      font: var(--mat-sys-title-small);
      font-family: var(--font-family);
      margin: 0;
    }

    .push__description,
    .push__note {
      color: var(--color-text-secondary);
      font: var(--mat-sys-body-medium);
      font-family: var(--font-family);
      margin: 0;
    }
  `,
})
export class PushPromptComponent {
  readonly target = input.required<PushTarget>();
  readonly description = input.required<string>();

  protected readonly push = inject(PushNotificationsService);
  protected readonly busy = signal(false);
  protected readonly justEnabled = signal(false);
  protected readonly failed = signal(false);

  constructor() {
    effect(() => {
      void this.push.refresh(this.target());
    });
  }

  protected async enable(): Promise<void> {
    this.busy.set(true);
    this.failed.set(false);
    const enabled = await this.push.enable(this.target());
    this.busy.set(false);
    this.justEnabled.set(enabled);
    this.failed.set(!enabled && this.push.permission() !== 'denied');
  }
}
