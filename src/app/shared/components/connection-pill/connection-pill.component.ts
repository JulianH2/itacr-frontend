import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ConnectionStatusService } from '@shared/services/connection-status.service';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

/** Header pill: "En línea" (sage) or "Offline" (neutral). Announced politely when it changes; icon only on narrow phones. */
@Component({
  selector: 'app-connection-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeComponent],
  template: `
    <span role="status" data-testid="connection-pill">
      @if (connection.online()) {
        <app-status-badge tone="success" icon="check-circle">
          <span class="pill__label">En línea</span>
        </app-status-badge>
      } @else {
        <app-status-badge tone="neutral" icon="cloud-off">
          <span class="pill__label">Offline</span>
        </app-status-badge>
      }
    </span>
  `,
  // On a narrow phone only the icon stays on screen, so the title of the screen fits; the text is still read aloud.
  styles: `
    @media (max-width: 420px) {
      .pill__label {
        clip-path: inset(50%);
        height: 1px;
        overflow: hidden;
        position: absolute;
        white-space: nowrap;
        width: 1px;
      }
    }
  `,
})
export class ConnectionPillComponent {
  protected readonly connection = inject(ConnectionStatusService);
}
