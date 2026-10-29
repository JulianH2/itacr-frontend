import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { filter, fromEvent, merge, timer } from 'rxjs';

import { SessionService } from '@shared/auth/session.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { IconComponent } from '@shared/components/icon/icon.component';
import {
  SegmentedControlComponent,
  type SegmentedOption,
} from '@shared/components/segmented-control/segmented-control.component';
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
import type { ActiveOrder } from '../../models/take-order.models';
import { OfflineOrdersService } from '../../services/offline-orders.service';
import { ORDERS_API } from '../../services/orders-api';
import { TakeOrderStore } from '../../services/take-order-store.service';

/** How often the active orders are asked again while the page is in front of the waiter. */
export const ACTIVE_ORDERS_REFRESH_MS = 15_000;

type OrderFilter = 'all' | 'kitchen' | 'ready';

const FILTER_OPTIONS: readonly SegmentedOption[] = [
  { value: 'all', label: 'Todos' },
  { value: 'kitchen', label: 'En cocina' },
  { value: 'ready', label: 'Listos' },
];

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
 * The waiter's home: start an order, go back to the one in progress, or follow the orders that are not delivered yet
 * (HU_08). It always shows the connection and how many orders are waiting to reach the kitchen (HU_07).
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
    SegmentedControlComponent,
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
  private readonly document = inject(DOCUMENT);

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

  private readonly activeResource = rxResource({ stream: () => this.api.getActiveOrders() });

  /** The last orders that loaded, kept when a refresh fails so the list stays on screen. */
  private readonly lastLoaded = signal<readonly ActiveOrder[] | null>(null);

  /** Pickup orders of customers that are Ready: no waiter took them, so a waiter finds them here to hand them over (HU_10). */
  private readonly pickupResource = rxResource({ stream: () => this.api.getReadyPickupOrders() });
  private readonly lastPickups = signal<readonly ActiveOrder[]>([]);

  protected readonly filterOptions = FILTER_OPTIONS;
  protected readonly statusFilter = signal<string>('all');

  private readonly activeOrders = computed(() =>
    (this.lastLoaded() ?? []).map((order) => ({
      id: order.id,
      title: `Orden #${order.orderNumber} · ${destinationLabel(order.tableNumber)}`,
      status: orderStatusLabel(order.status),
      tone: ORDER_STATUS_TONES[order.status],
      statusKey: order.status,
      time:
        order.status === 'Ready'
          ? `Listo desde ${formatTime(order.lastStatusChangeAt)}`
          : formatTime(order.createdAt),
    })),
  );

  protected readonly readyPickups = computed(() =>
    this.lastPickups().map((order) => ({
      id: order.id,
      title: `Orden #${order.orderNumber} · Para recoger`,
      time: `Listo desde ${formatTime(order.lastStatusChangeAt)}`,
    })),
  );

  protected readonly visibleOrders = computed(() => {
    const selected = this.statusFilter() as OrderFilter;
    return this.activeOrders().filter((order) => {
      if (selected === 'all') {
        return true;
      }
      return (order.statusKey === 'Ready') === (selected === 'ready');
    });
  });

  /** Active and ready come from the loaded orders; pending are the ones still on the device (HU_07). */
  protected readonly stats = computed(() => ({
    active: this.activeOrders().length,
    ready: this.activeOrders().filter((order) => order.statusKey === 'Ready').length,
    pending: this.offlineOrders.pendingCount(),
  }));

  protected readonly loading = computed(
    () => this.activeResource.isLoading() && this.lastLoaded() === null,
  );
  protected readonly failed = computed(() => this.activeResource.error() !== undefined);

  constructor() {
    effect(() => {
      if (this.activeResource.hasValue()) {
        this.lastLoaded.set(this.activeResource.value());
      }
    });
    effect(() => {
      if (this.pickupResource.hasValue()) {
        this.lastPickups.set(this.pickupResource.value());
      }
    });

    // Polling only while the page is visible; coming back to the tab asks right away.
    merge(
      timer(ACTIVE_ORDERS_REFRESH_MS, ACTIVE_ORDERS_REFRESH_MS),
      fromEvent(this.document, 'visibilitychange'),
    )
      .pipe(
        filter(() => !this.document.hidden && this.online() && !this.activeResource.isLoading()),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => this.reload());
  }

  protected reload(): void {
    this.activeResource.reload();
    this.pickupResource.reload();
  }

  protected discard(clientOrderId: string): void {
    void this.offlineOrders.discard(clientOrderId);
  }
}
