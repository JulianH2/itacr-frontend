import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';

import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';

import { destinationLabel, formatTime, orderStatusLabel } from '../../models/order-status';
import { ORDERS_API } from '../../services/orders-api';

/** The waiter refreshes the detail this often, so the kitchen's changes show up without reloading. */
export const ORDER_DETAIL_REFRESH_MS = 10_000;

/** Detail of one order with the timeline of its statuses (HU_05 CA4). */
@Component({
  selector: 'app-order-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, RouterLink, MxnPricePipe],
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

  protected readonly timeline = computed(() =>
    (this.order()?.timeline ?? []).map((entry) => ({
      text: entry.undone
        ? `Regresó a ${orderStatusLabel(entry.status)}`
        : orderStatusLabel(entry.status),
      time: formatTime(entry.changedAt),
      undone: entry.undone,
    })),
  );

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
