import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { ServerWakeService } from '@shared/services/server-wake.service';

import { IconComponent } from '../icon/icon.component';

/** Tells the user the server is waking up (about a minute after it was idle) instead of leaving a screen that looks broken. */
@Component({
  selector: 'app-server-wake-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, IconComponent],
  template: `
    @switch (wake.phase()) {
      @case ('waking') {
        <section class="wake" role="status" data-testid="server-waking">
          <app-icon class="wake__icon" name="clock" [size]="24" />
          <p class="wake__text">
            <strong>Despertando el servidor…</strong>
            Tras un rato sin uso puede tardar hasta un minuto. No cierres la aplicación: los datos
            cargarán solos.
          </p>
        </section>
      }
      @case ('failed') {
        <section class="wake wake--failed" role="alert" data-testid="server-failed">
          <app-icon class="wake__icon" name="cloud-off" [size]="24" />
          <p class="wake__text">
            <strong>No pudimos conectar con el servidor.</strong>
            Revisa tu conexión e inténtalo de nuevo en un momento.
          </p>
          <button
            type="button"
            mat-button
            data-testid="server-failed-dismiss"
            (click)="wake.dismiss()"
          >
            Cerrar
          </button>
        </section>
      }
    }
  `,
  styles: `
    .wake {
      align-items: center;
      background: var(--color-secondary-tint);
      border-radius: var(--radius-card);
      display: flex;
      gap: var(--space-2);
      margin: var(--space-2);
      padding: var(--space-2);
    }

    .wake__icon {
      color: var(--color-primary);
      flex: none;
    }

    .wake__text {
      color: var(--color-text-secondary);
      flex: 1 1 auto;
      font: var(--mat-sys-body-medium);
      font-family: var(--font-family);
      margin: 0;
    }

    .wake__text strong {
      color: var(--color-text);
      display: block;
    }
  `,
})
export class ServerWakeBannerComponent {
  protected readonly wake = inject(ServerWakeService);
}
