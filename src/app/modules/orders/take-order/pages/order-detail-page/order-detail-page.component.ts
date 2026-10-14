import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';

import { IconComponent } from '@shared/components/icon/icon.component';
import type { IconName } from '@shared/components/icon/icon-paths';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';

import { destinationLabel, formatTime, orderStatusLabel } from '../../models/order-status';
import { ORDER_STATUS_TONES } from '../../models/order-status-tone';
import type { OrderStatus } from '../../models/take-order.models';
import { ORDERS_API } from '../../services/orders-api';

/** The waiter refreshes the detail this often, so the kitchen's changes show up without reloading. */
export const ORDER_DETAIL_REFRESH_MS = 10_000;

/** The statuses an order goes through, in order. Used to show what is still ahead. */
const STATUS_FLOW: readonly OrderStatus[] = ['New', 'InPreparation', 'Ready', 'Delivered'];

const STATUS_ICONS: Readonly<Record<OrderStatus, IconName>> = {
  New: 'list',
  InPreparation: 'kitchen',
  Ready: 'check-circle',
  Delivered: 'send',
};

type StepState = 'done' | 'current' | 'undone';

/** Detail of one order with the timeline of its statuses (HU_05 CA4). */
@Component({
  selector: 'app-order-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink, IconComponent, MxnPricePipe, StatusBadgeComponent],
  templateUrl: './order-detail-page.component.html',
  styleUrl: './order-detail-page.component.scss',
})
export class OrderDetailPageComponent {
  private readonly api = inject(ORDERS_API);

  /** Route parameter `:id`. */
  readonly id = input.required<string>();

  private readonly orderResource = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.api.getOrder(params),
  });

  protected readonly order = computed(() =>
    this.orderResource.hasValue() ? this.orderResource.value() : null,
  );
  protected readonly isLoading = computed(() => this.orderResource.isLoading() && !this.order());
  protected readonly notFound = computed(() => {
    const error = this.orderResource.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  protected readonly hasError = computed(
    () => this.orderResource.error() !== undefined && !this.notFound() && !this.order(),
  );

  protected readonly timeline = computed(() => {
    const entries = this.order()?.timeline ?? [];
    return entries.map((entry, index) => {
      const state: StepState = entry.undone
        ? 'undone'
        : index === entries.length - 1
          ? 'current'
          : 'done';
      return {
        text: entry.undone
          ? `Regresó a ${orderStatusLabel(entry.status)}`
          : orderStatusLabel(entry.status),
        time: formatTime(entry.changedAt),
        undone: entry.undone,
        state,
        icon: entry.undone ? ('arrow-left' as const) : STATUS_ICONS[entry.status],
      };
    });
  });

  /** Statuses after the current one that the order has not reached yet. */
  protected readonly upcoming = computed(() => {
    const order = this.order();
    if (order === null) {
      return [];
    }
    return STATUS_FLOW.slice(STATUS_FLOW.indexOf(order.status) + 1).map((status) => ({
      label: orderStatusLabel(status),
      icon: STATUS_ICONS[status],
    }));
  });

  protected readonly createdTime = computed(() => this.timeline()[0]?.time ?? '');
  protected readonly statusTone = computed(() => {
    const order = this.order();
    return order === null ? 'neutral' : ORDER_STATUS_TONES[order.status];
  });

  protected readonly statusLabel = orderStatusLabel;
  protected readonly destinationLabel = destinationLabel;

  constructor() {
    interval(ORDER_DETAIL_REFRESH_MS)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.orderResource.reload());
  }

  protected reload(): void {
    this.orderResource.reload();
  }
}
