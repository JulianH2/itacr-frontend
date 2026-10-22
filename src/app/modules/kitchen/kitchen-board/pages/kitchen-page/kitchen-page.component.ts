import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';

import { IconComponent } from '@shared/components/icon/icon.component';

import { KitchenColumnComponent } from '../../components/kitchen-column/kitchen-column.component';
import { provideKitchenApi } from '../../kitchen.config';
import { statusLabel } from '../../models/kitchen-order';
import { KitchenAlertService } from '../../services/kitchen-alert.service';
import { KitchenStore } from '../../services/kitchen-store.service';

const CLOCK_FORMAT = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' });

/** Kitchen Display System: every active order in three columns, refreshed automatically. */
@Component({
  selector: 'app-kitchen-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, KitchenColumnComponent],
  providers: [provideKitchenApi(), KitchenStore, KitchenAlertService],
  templateUrl: './kitchen-page.component.html',
  styleUrl: './kitchen-page.component.scss',
})
export class KitchenPageComponent {
  protected readonly store = inject(KitchenStore);
  protected readonly alert = inject(KitchenAlertService);
  protected readonly statusLabel = statusLabel;
  protected readonly clock = computed(() => CLOCK_FORMAT.format(this.store.now()));

  constructor() {
    effect(() => {
      // The counter starts at 0, so nothing rings for the orders that were already on the board.
      if (this.store.newOrderAlerts() > 0) {
        untracked(() => this.alert.play());
      }
    });
  }
}
