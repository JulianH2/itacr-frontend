import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';

import { KitchenColumnComponent } from '../../components/kitchen-column/kitchen-column.component';
import { provideKitchenApi } from '../../kitchen.config';
import { statusLabel } from '../../models/kitchen-order';
import { KitchenAlertService } from '../../services/kitchen-alert.service';
import { KitchenStore } from '../../services/kitchen-store.service';

/** Kitchen Display System: every active order in three columns, refreshed automatically. */
@Component({
  selector: 'app-kitchen-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KitchenColumnComponent],
  providers: [provideKitchenApi(), KitchenStore, KitchenAlertService],
  templateUrl: './kitchen-page.component.html',
  styleUrl: './kitchen-page.component.scss',
})
export class KitchenPageComponent {
  protected readonly store = inject(KitchenStore);
  protected readonly alert = inject(KitchenAlertService);
  protected readonly statusLabel = statusLabel;

  constructor() {
    effect(() => {
      // The counter starts at 0, so nothing rings for the orders that were already on the board.
      if (this.store.newOrderAlerts() > 0) {
        untracked(() => this.alert.play());
      }
    });
  }
}
