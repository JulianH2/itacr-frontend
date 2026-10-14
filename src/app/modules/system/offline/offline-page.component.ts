import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { StatePageComponent } from '@shared/components/state-page/state-page.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

/** Explains that the device has no connection and that orders in progress keep working. */
@Component({
  selector: 'app-offline-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink, StatePageComponent, StatusBadgeComponent],
  template: `
    <app-state-page
      icon="cloud-off"
      tone="neutral"
      heading="Sin conexión a internet"
      description="Algunos datos podrían no estar actualizados. ITACR sigue funcionando sin conexión para los pedidos en curso."
    >
      <app-status-badge state-badge tone="neutral" icon="cloud-off">
        Modo offline activo
      </app-status-badge>
      <button type="button" mat-flat-button data-testid="retry" (click)="retry()">
        Reintentar conexión
      </button>
      <a mat-button routerLink="/" data-testid="continue-offline">Seguir sin conexión</a>
    </app-state-page>
  `,
})
export class OfflinePageComponent {
  private readonly document = inject(DOCUMENT);

  protected retry(): void {
    this.document.defaultView?.location.reload();
  }
}
