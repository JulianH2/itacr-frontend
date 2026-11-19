import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import {
  type BadgeTone,
  StatusBadgeComponent,
} from '@shared/components/status-badge/status-badge.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';

import {
  CHANNEL_LABELS,
  STATUS_LABELS,
  formatDuration,
  orderChannelLabel,
} from '../../models/manager-format';
import type {
  ManagerChannel,
  ManagerOrderStatus,
  ManagerOrdersPage,
} from '../../models/manager.models';

/** Badge color of each order status, the same as the rest of the app. */
const STATUS_TONES: Readonly<Record<ManagerOrderStatus, BadgeTone>> = {
  New: 'pending',
  InPreparation: 'brand',
  Ready: 'success',
  Delivered: 'neutral',
};

const TIME = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

/**
 * The table of recent orders of the manager's dashboard (HU_16), filtered by channel and by status. Each row opens the detail of the
 * order. While the next page loads, the last one stays on screen, dimmed.
 */
@Component({
  selector: 'app-recent-orders-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    RouterLink,
    EmptyStateComponent,
    MxnPricePipe,
    StatusBadgeComponent,
  ],
  template: `
    <section
      class="orders"
      aria-labelledby="orders-title"
      [class.orders--refreshing]="refreshing()"
    >
      <header class="orders__head">
        <h2 id="orders-title" class="orders__title">Pedidos recientes</h2>
        <div class="orders__filters">
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>Canal</mat-label>
            <select
              matNativeControl
              data-testid="filter-channel"
              [value]="channel() ?? ''"
              (change)="channelChange.emit(toChannel($any($event.target).value))"
            >
              <option value="">Todos</option>
              @for (option of channelOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </mat-form-field>
          <mat-form-field subscriptSizing="dynamic">
            <mat-label>Estado</mat-label>
            <select
              matNativeControl
              data-testid="filter-status"
              [value]="status() ?? ''"
              (change)="statusChange.emit(toStatus($any($event.target).value))"
            >
              <option value="">Todos</option>
              @for (option of statusOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </mat-form-field>
        </div>
      </header>

      @if (failed()) {
        <p class="orders__error" role="alert" data-testid="orders-error">
          No pudimos actualizar los pedidos.
          <button type="button" mat-button (click)="retry.emit()">Reintentar</button>
        </p>
      }

      @if (page(); as data) {
        @if (data.items.length === 0) {
          <app-empty-state
            heading="No hay pedidos"
            description="Ningún pedido coincide con el rango y los filtros elegidos."
          />
        } @else {
          <div class="orders__wrap">
            <table class="orders__table" data-testid="orders-table">
              <thead>
                <tr>
                  <th scope="col">Pedido</th>
                  <th scope="col">Canal</th>
                  <th scope="col">Estado</th>
                  <th scope="col" class="orders__num">Total</th>
                  <th scope="col">Creado</th>
                  <th scope="col" class="orders__num">Preparación</th>
                </tr>
              </thead>
              <tbody>
                @for (order of data.items; track order.id) {
                  <tr [attr.data-testid]="'order-row-' + order.orderNumber">
                    <th scope="row">
                      <a [routerLink]="['/manager/orders', order.id]" class="orders__link">
                        <span class="sr-only">Ver el detalle del pedido </span>#{{
                          order.orderNumber
                        }}
                      </a>
                    </th>
                    <td>{{ channelLabel(order.channel, order.tableNumber) }}</td>
                    <td>
                      <app-status-badge [tone]="tone(order.status)">{{
                        statusLabel(order.status)
                      }}</app-status-badge>
                    </td>
                    <td class="orders__num tabular">{{ order.total | mxnPrice }}</td>
                    <td class="tabular">{{ time(order.createdAt) }}</td>
                    <td class="orders__num tabular">{{ duration(order.preparationSeconds) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <nav class="orders__pager" aria-label="Páginas de pedidos">
            <button
              type="button"
              mat-button
              data-testid="orders-previous"
              [disabled]="data.page <= 1"
              (click)="pageChange.emit(data.page - 1)"
            >
              Anterior
            </button>
            <span class="orders__page" data-testid="orders-page">
              Página {{ data.page }} de {{ totalPages() }} · {{ data.totalCount }} pedidos
            </span>
            <button
              type="button"
              mat-button
              data-testid="orders-next"
              [disabled]="data.page >= totalPages()"
              (click)="pageChange.emit(data.page + 1)"
            >
              Siguiente
            </button>
          </nav>
        }
      }
    </section>
  `,
  styles: `
    .orders {
      background: var(--color-surface);
      border: 1px solid var(--color-card-border);
      border-radius: var(--radius-card);
      display: grid;
      gap: var(--space-2);
      padding: var(--space-2);
      transition: opacity var(--duration-base) var(--ease-standard);
    }

    .orders--refreshing {
      opacity: 0.6;
    }

    .orders__head {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-2);
      justify-content: space-between;
    }

    .orders__title {
      font: var(--mat-sys-title-medium);
      font-family: var(--font-family);
      margin: 0;
    }

    .orders__filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
    }

    .orders__error {
      background: var(--color-error-tint);
      border-radius: var(--radius-control);
      color: var(--color-error);
      font: var(--mat-sys-body-medium);
      font-family: var(--font-family);
      margin: 0;
      padding: var(--space-1) var(--space-2);
    }

    .orders__wrap {
      overflow-x: auto;
    }

    .orders__table {
      border-collapse: collapse;
      font: var(--mat-sys-body-medium);
      font-family: var(--font-family);
      min-width: 560px;
      width: 100%;
    }

    .orders__table th,
    .orders__table td {
      border-bottom: 1px solid var(--color-divider);
      padding: var(--space-1);
      text-align: left;
      white-space: nowrap;
    }

    .orders__table thead th {
      color: var(--color-text-secondary);
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
    }

    .orders__table .orders__num {
      text-align: right;
    }

    .orders__link {
      color: var(--color-primary);
      display: inline-block;
      font-weight: 600;
      min-height: var(--touch-target);
      line-height: var(--touch-target);
      text-decoration: none;
    }

    .orders__pager {
      align-items: center;
      display: flex;
      gap: var(--space-1);
      justify-content: space-between;
    }

    .orders__page {
      color: var(--color-text-secondary);
      font: var(--mat-sys-body-medium);
      font-family: var(--font-family);
      text-align: center;
    }
  `,
})
export class RecentOrdersTableComponent {
  /** The page of orders to show; null before the first answer. */
  readonly page = input.required<ManagerOrdersPage | null>();
  readonly channel = input.required<ManagerChannel | null>();
  readonly status = input.required<ManagerOrderStatus | null>();
  readonly totalPages = input.required<number>();
  readonly refreshing = input(false);
  readonly failed = input(false);

  readonly channelChange = output<ManagerChannel | null>();
  readonly statusChange = output<ManagerOrderStatus | null>();
  readonly pageChange = output<number>();
  readonly retry = output();

  protected readonly channelOptions = (Object.keys(CHANNEL_LABELS) as ManagerChannel[]).map(
    (value) => ({
      value,
      label: CHANNEL_LABELS[value],
    }),
  );
  protected readonly statusOptions = (Object.keys(STATUS_LABELS) as ManagerOrderStatus[]).map(
    (value) => ({
      value,
      label: STATUS_LABELS[value],
    }),
  );

  protected readonly channelLabel = orderChannelLabel;
  protected readonly duration = formatDuration;

  protected toChannel(value: string): ManagerChannel | null {
    return value === 'Waiter' || value === 'Pickup' ? value : null;
  }

  protected toStatus(value: string): ManagerOrderStatus | null {
    return value in STATUS_LABELS ? (value as ManagerOrderStatus) : null;
  }

  protected statusLabel(status: ManagerOrderStatus): string {
    return STATUS_LABELS[status];
  }

  protected tone(status: ManagerOrderStatus): BadgeTone {
    return STATUS_TONES[status];
  }

  protected time(instant: string): string {
    return TIME.format(new Date(instant));
  }
}
