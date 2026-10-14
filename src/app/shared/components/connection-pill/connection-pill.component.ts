import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ConnectionStatusService } from '@shared/services/connection-status.service';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

/** Header pill: "En línea" (sage) or "Offline" (neutral). Announced politely when it changes. */
@Component({
  selector: 'app-connection-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeComponent],
  template: `
    <span role="status" data-testid="connection-pill">
      @if (connection.online()) {
        <app-status-badge tone="success" icon="check-circle">En línea</app-status-badge>
      } @else {
        <app-status-badge tone="neutral" icon="cloud-off">Offline</app-status-badge>
      }
    </span>
  `,
})
export class ConnectionPillComponent {
  protected readonly connection = inject(ConnectionStatusService);
}
