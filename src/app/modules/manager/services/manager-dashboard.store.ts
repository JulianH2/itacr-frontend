import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';

import { type DayRange, rangeError, toInstants, todayRange } from '../models/date-range';
import type {
  ManagerChannel,
  ManagerDashboard,
  ManagerOrderStatus,
  ManagerOrdersPage,
} from '../models/manager.models';
import { MANAGER_API } from './manager-api';

export const ORDERS_PAGE_SIZE = 10;

/**
 * State of the manager's dashboard (HU_16): the date range that scopes everything, the filters of the table, and the numbers the API
 * answers for them. While a new answer loads, the last one stays on screen, so the page does not jump or empty itself; if a request
 * fails, the last numbers stay and the page says so.
 *
 * Provided by the manager route, so every visit starts from today.
 */
@Injectable()
export class ManagerDashboardStore {
  private readonly api = inject(MANAGER_API);

  private readonly rangeState = signal<DayRange>(todayRange());
  private readonly channelState = signal<ManagerChannel | null>(null);
  private readonly statusState = signal<ManagerOrderStatus | null>(null);
  private readonly pageState = signal(1);

  readonly range = this.rangeState.asReadonly();
  readonly channel = this.channelState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly page = this.pageState.asReadonly();

  /** Why the range cannot be asked for, or null. The numbers keep the last valid range meanwhile. */
  readonly rangeError = computed(() => rangeError(this.rangeState()));
  /** The range as the API takes it, or nothing while the range is not valid, so no request the API would refuse is sent. */
  private readonly askedInstants = computed(() =>
    this.rangeError() === null ? toInstants(this.rangeState()) : undefined,
  );

  private readonly dashboardResource = rxResource({
    params: () => this.askedInstants(),
    stream: ({ params }) =>
      this.api
        .getDashboard(params.from, params.to)
        .pipe(
          tap({ error: (error: unknown) => console.error('Failed to load the dashboard', error) }),
        ),
  });

  private readonly ordersResource = rxResource({
    params: () => {
      const instants = this.askedInstants();
      return instants === undefined
        ? undefined
        : {
            ...instants,
            channel: this.channelState(),
            status: this.statusState(),
            page: this.pageState(),
          };
    },
    stream: ({ params }) =>
      this.api
        .getOrders({ ...params, pageSize: ORDERS_PAGE_SIZE })
        .pipe(
          tap({ error: (error: unknown) => console.error('Failed to load the orders', error) }),
        ),
  });

  private readonly lastDashboard = signal<ManagerDashboard | null>(null);
  private readonly lastOrders = signal<ManagerOrdersPage | null>(null);

  readonly dashboard = this.lastDashboard.asReadonly();
  readonly orders = this.lastOrders.asReadonly();

  /** Nothing has been shown yet: the first load. */
  readonly isLoadingFirstTime = computed(
    () => this.lastDashboard() === null && this.dashboardResource.isLoading(),
  );
  /** New numbers are loading while the last ones are still on screen. */
  readonly isRefreshing = computed(
    () => this.lastDashboard() !== null && this.dashboardResource.isLoading(),
  );
  readonly isRefreshingOrders = computed(
    () => this.lastOrders() !== null && this.ordersResource.isLoading(),
  );
  readonly dashboardFailed = computed(() => this.dashboardResource.error() !== undefined);
  readonly ordersFailed = computed(() => this.ordersResource.error() !== undefined);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil((this.lastOrders()?.totalCount ?? 0) / ORDERS_PAGE_SIZE)),
  );

  constructor() {
    // A resource in error state throws when its value is read, so the last answer is only taken when there is one.
    effect(() => {
      if (this.dashboardResource.hasValue()) {
        this.lastDashboard.set(this.dashboardResource.value());
      }
    });
    effect(() => {
      if (this.ordersResource.hasValue()) {
        this.lastOrders.set(this.ordersResource.value());
      }
    });
  }

  /** A new range scopes the numbers and the table, which goes back to its first page. A range the API would refuse is not asked for. */
  setRange(range: DayRange): void {
    this.rangeState.set(range);
    if (rangeError(range) === null) {
      this.pageState.set(1);
    }
  }

  setChannel(channel: ManagerChannel | null): void {
    this.channelState.set(channel);
    this.pageState.set(1);
  }

  setStatus(status: ManagerOrderStatus | null): void {
    this.statusState.set(status);
    this.pageState.set(1);
  }

  goToPage(page: number): void {
    this.pageState.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  reload(): void {
    this.dashboardResource.reload();
    this.ordersResource.reload();
  }
}
