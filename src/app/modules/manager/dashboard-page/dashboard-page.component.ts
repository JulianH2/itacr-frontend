import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { StatCardComponent } from '@shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';

import { RecentOrdersTableComponent } from '../components/recent-orders-table/recent-orders-table.component';
import { SalesTrendChartComponent } from '../components/sales-trend-chart/sales-trend-chart.component';
import {
  type DayRange,
  lastDaysRange,
  sameRange,
  todayRange,
  toInstants,
  yesterdayRange,
} from '../models/date-range';
import { CHANNEL_LABELS, formatDuration } from '../models/manager-format';
import type { ChannelMetrics } from '../models/manager.models';
import { ManagerDashboardStore } from '../services/manager-dashboard.store';

interface Preset {
  readonly label: string;
  readonly range: () => DayRange;
}

const PRESETS: readonly Preset[] = [
  { label: 'Hoy', range: todayRange },
  { label: 'Ayer', range: yesterdayRange },
  { label: 'Últimos 7 días', range: () => lastDaysRange(7) },
];

/**
 * The manager's dashboard (HU_16): the sales of the day, the orders, and the average time to prepare an order in each channel, with
 * the channel that takes longer pointed out; the trend; and the table of recent orders, with a filter by channel and by status and
 * the detail of every order. The date range scopes everything on the page.
 */
@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MxnPricePipe,
    RecentOrdersTableComponent,
    SalesTrendChartComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  protected readonly store = inject(ManagerDashboardStore);

  protected readonly presets = PRESETS;
  protected readonly formatDuration = formatDuration;
  protected readonly channelLabels = CHANNEL_LABELS;

  /** The range the numbers on screen are for, as the instants the chart builds its bars from. */
  protected readonly shownRange = computed(() => {
    const dashboard = this.store.dashboard();
    return dashboard === null
      ? toInstants(this.store.range())
      : { from: dashboard.from, to: dashboard.to };
  });

  protected isActive(preset: Preset): boolean {
    return sameRange(this.store.range(), preset.range());
  }

  protected setStart(start: string): void {
    this.store.setRange({ ...this.store.range(), start });
  }

  protected setEnd(end: string): void {
    this.store.setRange({ ...this.store.range(), end });
  }

  protected isSlowest(metrics: ChannelMetrics): boolean {
    return this.store.dashboard()?.slowestChannel === metrics.channel;
  }

  protected preparedCaption(metrics: ChannelMetrics): string {
    if (metrics.preparedOrders === 0) {
      return 'Aún sin pedidos listos';
    }
    return metrics.preparedOrders === 1
      ? 'Promedio de 1 pedido listo'
      : `Promedio de ${metrics.preparedOrders} pedidos listos`;
  }
}
