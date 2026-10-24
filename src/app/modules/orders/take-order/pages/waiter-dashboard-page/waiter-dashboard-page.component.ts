import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { SessionService } from '@shared/auth/session.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import { StatCardComponent } from '@shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import {
  TableCardComponent,
  type TableStatus,
} from '@shared/components/table-card/table-card.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';
import { ConnectionStatusService } from '@shared/services/connection-status.service';

import { destinationLabel, formatTime, orderStatusLabel } from '../../models/order-status';
import { ORDER_STATUS_TONES } from '../../models/order-status-tone';
import { OfflineOrdersService } from '../../services/offline-orders.service';
import { ORDERS_API } from '../../services/orders-api';
import { TakeOrderStore } from '../../services/take-order-store.service';

export interface DashboardTable {
  readonly number: number;
  readonly status: TableStatus;
  readonly seats: number;
}

const DATE_FORMAT = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

/**
 * The waiter's home: start an order, go back to the one in progress, or open one sent recently. It always shows the
 * connection and how many orders are waiting to reach the kitchen (HU_07).
 */
@Component({
  selector: 'app-waiter-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    RouterLink,
    EmptyStateComponent,
    IconComponent,
    MxnPricePipe,
    StatCardComponent,
    StatusBadgeComponent,
    TableCardComponent,
  ],
  templateUrl: './waiter-dashboard-page.component.html',
  styleUrl: './waiter-dashboard-page.component.scss',
})
export class WaiterDashboardPageComponent {
  protected readonly store = inject(TakeOrderStore);
  private readonly session = inject(SessionService);
  private readonly api = inject(ORDERS_API);
  private readonly offlineOrders = inject(OfflineOrdersService);

  protected readonly online = inject(ConnectionStatusService).online;
  protected readonly syncText = computed(() => {
    const pending = this.offlineOrders.pendingCount();
    if (pending === 1) {
      return '1 pedido pendiente de sincronizar';
    }
    if (pending > 1) {
      return `${pending} pedidos pendientes de sincronizar`;
    }
    return this.offlineOrders.orders().length > 0
      ? 'Revisa los pedidos que no se pudieron enviar'
      : 'Todos tus pedidos están en cocina';
  });
  protected readonly unsentOrders = computed(() =>
    this.offlineOrders.orders().map((order) => ({
      clientOrderId: order.clientOrderId,
      title: `${destinationLabel(order.tableNumber)} · ${order.itemCount} ${order.itemCount === 1 ? 'producto' : 'productos'}`,
      total: order.total,
      time: formatTime(order.request.createdAt),
      failed: order.state === 'failed',
      error: order.error,
    })),
  );

  protected readonly displayName = computed(() => this.session.employee()?.displayName ?? '');
  protected readonly firstName = computed(() => this.displayName().split(' ')[0] ?? '');
  protected readonly today = DATE_FORMAT.format(new Date());

  /** Tables with their status. Empty until the tables story supplies them; the grid is ready for it. */
  protected readonly tables = signal<readonly DashboardTable[]>([]);

  private readonly recentResource = rxResource({ stream: () => this.api.getActiveOrders() });

  protected readonly recentOrders = computed(() =>
    (this.recentResource.hasValue() ? this.recentResource.value() : []).map((order) => ({
      id: order.id,
      title: `Orden #${order.orderNumber} · ${destinationLabel(order.tableNumber)}`,
      status: orderStatusLabel(order.status),
      tone: ORDER_STATUS_TONES[order.status],
      statusKey: order.status,
      time: formatTime(order.createdAt),
    })),
  );

  /** Counts over the orders loaded above, not over the whole shift. */
  protected readonly stats = computed(() => ({
    inKitchen: this.recentOrders().filter(
      (order) => order.statusKey === 'New' || order.statusKey === 'InPreparation',
    ).length,
    ready: this.recentOrders().filter((order) => order.statusKey === 'Ready').length,
  }));

  protected readonly recentFailed = computed(() => this.recentResource.error() !== undefined);

  protected discard(clientOrderId: string): void {
    void this.offlineOrders.discard(clientOrderId);
  }
}
