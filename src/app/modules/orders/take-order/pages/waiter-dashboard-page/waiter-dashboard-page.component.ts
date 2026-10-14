import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { SessionService } from '@shared/auth/session.service';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';

import { destinationLabel, formatTime, orderStatusLabel } from '../../models/order-status';
import { ORDERS_API } from '../../services/orders-api';
import { TakeOrderStore } from '../../services/take-order-store.service';

/** The waiter's home: start an order, go back to the one in progress, or open one sent recently. */
@Component({
  selector: 'app-waiter-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink, MxnPricePipe],
  templateUrl: './waiter-dashboard-page.component.html',
  styleUrl: './waiter-dashboard-page.component.scss',
})
export class WaiterDashboardPageComponent {
  protected readonly store = inject(TakeOrderStore);
  private readonly session = inject(SessionService);
  private readonly api = inject(ORDERS_API);

  protected readonly displayName = computed(() => this.session.employee()?.displayName ?? '');

  private readonly recentResource = rxResource({ stream: () => this.api.getRecentOrders() });

  protected readonly recentOrders = computed(() =>
    (this.recentResource.hasValue() ? this.recentResource.value() : []).map((order) => ({
      id: order.id,
      title: `Orden #${order.orderNumber} · ${destinationLabel(order.tableNumber)}`,
      status: orderStatusLabel(order.status),
      time: formatTime(order.createdAt),
    })),
  );
  protected readonly recentFailed = computed(() => this.recentResource.error() !== undefined);
}
