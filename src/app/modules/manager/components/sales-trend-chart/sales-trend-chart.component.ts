import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { SegmentedControlComponent } from '@shared/components/segmented-control/segmented-control.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';

import type { TrendPoint } from '../../models/manager.models';
import { type TrendBucket, buildBuckets } from '../../models/trend-buckets';

type Metric = 'sales' | 'orders';

const METRIC_OPTIONS = [
  { value: 'sales', label: 'Ventas' },
  { value: 'orders', label: 'Pedidos' },
] as const;

/** At most this many labels on the horizontal axis, so they never touch. */
const MAX_AXIS_LABELS = 4;

const PRICE = new MxnPricePipe();

/** The top of the scale: the highest value rounded up to 1, 2, 5 or 10 times a power of ten, so the ticks are round numbers. */
function niceMax(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const fraction = value / magnitude;
  const step = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * The trend of the range (HU_16): one bar per hour, or per day when the range is long, of the sales (the total of the orders
 * delivered) or of the orders created. One measure at a time on one axis, so the bars are comparable. Hovering or focusing a bar
 * shows its value; the same numbers are in a table behind "Ver tabla".
 */
@Component({
  selector: 'app-sales-trend-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SegmentedControlComponent],
  template: `
    <section class="trend" aria-labelledby="trend-title" [class.trend--refreshing]="refreshing()">
      <header class="trend__head">
        <h2 id="trend-title" class="trend__title">Tendencia</h2>
        <app-segmented-control
          class="trend__metric"
          label="Medida de la gráfica"
          testIdPrefix="trend-metric-"
          [options]="metricOptions"
          [value]="metric()"
          (valueChange)="setMetric($event)"
        />
        <button
          type="button"
          class="trend__toggle"
          data-testid="trend-table-toggle"
          (click)="showTable.set(!showTable())"
        >
          {{ showTable() ? 'Ver gráfica' : 'Ver tabla' }}
        </button>
      </header>

      @if (!hasData()) {
        <p class="trend__empty" data-testid="trend-empty">No hay pedidos en este rango.</p>
      } @else if (showTable()) {
        <div class="trend__table-wrap">
          <table class="trend__table" data-testid="trend-table">
            <caption class="sr-only">
              {{
                metricName()
              }}
              por
              {{
                unit()
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ unitTitle() }}</th>
                <th scope="col" class="trend__num">Pedidos</th>
                <th scope="col" class="trend__num">Ventas</th>
              </tr>
            </thead>
            <tbody>
              @for (bucket of buckets(); track bucket.start.getTime()) {
                <tr>
                  <th scope="row">{{ bucket.label }}</th>
                  <td class="trend__num tabular">{{ bucket.orders }}</td>
                  <td class="trend__num tabular">{{ price(bucket.sales) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="chart" role="group" [attr.aria-label]="chartLabel()" data-testid="trend-chart">
          <div class="chart__y" aria-hidden="true">
            @for (tick of ticks(); track tick) {
              <span class="chart__tick tabular">{{ format(tick) }}</span>
            }
          </div>

          <div class="chart__plot">
            <span class="chart__grid chart__grid--top" aria-hidden="true"></span>
            <span class="chart__grid chart__grid--middle" aria-hidden="true"></span>
            <div class="chart__bars">
              @for (bucket of buckets(); track bucket.start.getTime(); let index = $index) {
                <div
                  class="slot"
                  (pointerenter)="hovered.set(index)"
                  (pointerleave)="hovered.set(null)"
                >
                  <button
                    type="button"
                    class="slot__hit"
                    [class.slot__hit--active]="hovered() === index"
                    [attr.aria-label]="describe(bucket)"
                    [attr.data-testid]="'trend-bar-' + index"
                    (focus)="hovered.set(index)"
                    (blur)="hovered.set(null)"
                  >
                    <span class="bar" [style.height.%]="heightOf(bucket)">
                      @if (index === peakIndex()) {
                        <span class="bar__label tabular" aria-hidden="true">{{
                          format(valueOf(bucket))
                        }}</span>
                      }
                    </span>
                  </button>
                </div>
              }
            </div>

            @if (hoveredBucket(); as bucket) {
              <div
                class="tip"
                role="status"
                data-testid="trend-tooltip"
                [style.left.%]="tooltipLeft()"
                [style.bottom]="'calc(' + tooltipBottom() + '% + 26px)'"
              >
                <strong class="tip__value tabular">{{ format(valueOf(bucket)) }}</strong>
                <span class="tip__label">{{ bucket.label }}</span>
              </div>
            }
          </div>

          <div class="chart__x" aria-hidden="true">
            @for (bucket of buckets(); track bucket.start.getTime(); let index = $index) {
              <span class="chart__x-slot">{{ index % axisStep() === 0 ? bucket.label : '' }}</span>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .trend {
      background: var(--color-surface);
      border: 1px solid var(--color-card-border);
      border-radius: var(--radius-card);
      display: grid;
      gap: var(--space-2);
      padding: var(--space-2);
      transition: opacity var(--duration-base) var(--ease-standard);
    }

    .trend--refreshing {
      opacity: 0.6;
    }

    .trend__head {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-2);
      justify-content: space-between;
    }

    .trend__title {
      font: var(--mat-sys-title-medium);
      font-family: var(--font-family);
      margin: 0;
    }

    .trend__metric {
      min-width: 180px;
    }

    .trend__toggle {
      background: transparent;
      border: 0;
      color: var(--color-primary);
      cursor: pointer;
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
      min-height: var(--touch-target);
      padding: 0 var(--space-1);
    }

    .trend__empty {
      color: var(--color-text-secondary);
      font: var(--mat-sys-body-large);
      font-family: var(--font-family);
      margin: 0;
      padding: var(--space-4) 0;
      text-align: center;
    }

    .chart {
      display: grid;
      gap: var(--space-half) var(--space-1);
      grid-template-columns: auto 1fr;
    }

    .chart__y {
      display: flex;
      flex-direction: column-reverse;
      height: 200px;
      justify-content: space-between;
    }

    .chart__tick {
      color: var(--color-text-secondary);
      font: var(--mat-sys-label-small);
      font-family: var(--font-family);
      line-height: 1;
      text-align: right;
    }

    .chart__plot {
      border-bottom: 1px solid var(--color-border-strong);
      height: 200px;
      position: relative;
    }

    .chart__grid {
      border-top: 1px solid var(--color-divider);
      left: 0;
      position: absolute;
      right: 0;
    }

    .chart__grid--top {
      top: 0;
    }

    .chart__grid--middle {
      top: 50%;
    }

    .chart__bars {
      align-items: stretch;
      display: flex;
      height: 100%;
      position: relative;
    }

    .slot {
      display: flex;
      flex: 1 1 0;
      min-width: 0;
    }

    .slot__hit {
      align-items: flex-end;
      background: transparent;
      border: 0;
      cursor: default;
      display: flex;
      height: 100%;
      justify-content: center;
      padding: 0;
      width: 100%;
    }

    .slot__hit:focus-visible {
      outline: var(--focus-ring);
      outline-offset: -2px;
    }

    /* A thin column that grows from the baseline: square at the base, 4px round at the end, at most 24px wide. */
    .bar {
      background: var(--color-primary);
      border-radius: 4px 4px 0 0;
      display: block;
      max-width: 24px;
      position: relative;
      transition: filter var(--duration-fast) var(--ease-standard);
      width: 60%;
    }

    .slot__hit--active .bar {
      filter: brightness(1.15);
    }

    .bar__label {
      bottom: 100%;
      color: var(--color-text);
      font: var(--mat-sys-label-small);
      font-family: var(--font-family);
      left: 50%;
      padding-bottom: 2px;
      position: absolute;
      transform: translateX(-50%);
      white-space: nowrap;
    }

    .chart__x {
      display: flex;
      grid-column: 2;
    }

    .chart__x-slot {
      color: var(--color-text-secondary);
      flex: 1 1 0;
      font: var(--mat-sys-label-small);
      font-family: var(--font-family);
      min-width: 0;
      overflow: visible;
      text-align: center;
      white-space: nowrap;
    }

    .tip {
      background: var(--color-surface);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-control);
      box-shadow: var(--shadow-subtle);
      display: grid;
      padding: var(--space-half) var(--space-1);
      pointer-events: none;
      position: absolute;
      transform: translateX(-50%);
      white-space: nowrap;
      z-index: 1;
    }

    .tip__value {
      font: var(--mat-sys-title-small);
      font-family: var(--font-family);
    }

    .tip__label {
      color: var(--color-text-secondary);
      font: var(--mat-sys-label-small);
      font-family: var(--font-family);
    }

    .trend__table-wrap {
      overflow-x: auto;
    }

    .trend__table {
      border-collapse: collapse;
      font: var(--mat-sys-body-medium);
      font-family: var(--font-family);
      width: 100%;
    }

    .trend__table th,
    .trend__table td {
      border-bottom: 1px solid var(--color-divider);
      padding: var(--space-1);
      text-align: left;
    }

    .trend__table .trend__num {
      text-align: right;
    }
  `,
})
export class SalesTrendChartComponent {
  /** The hours of the range that had something, as the API sends them. */
  readonly points = input.required<readonly TrendPoint[]>();
  /** The range, as the two UTC instants the API was asked with. */
  readonly from = input.required<string>();
  readonly to = input.required<string>();
  /** New numbers are loading: the chart keeps its last render, dimmed. */
  readonly refreshing = input(false);

  protected readonly metricOptions = METRIC_OPTIONS;
  protected readonly metric = signal<Metric>('sales');
  protected readonly showTable = signal(false);
  protected readonly hovered = signal<number | null>(null);

  protected readonly buckets = computed(() => buildBuckets(this.points(), this.from(), this.to()));
  protected readonly isDaily = computed(() => {
    const [first, second] = this.buckets();
    return second !== undefined && second.start.getTime() - first.start.getTime() > 60 * 60 * 1000;
  });
  protected readonly unit = computed(() => (this.isDaily() ? 'día' : 'hora'));
  protected readonly unitTitle = computed(() => (this.isDaily() ? 'Día' : 'Hora'));
  protected readonly metricName = computed(() =>
    this.metric() === 'sales' ? 'Ventas' : 'Pedidos',
  );

  protected readonly hasData = computed(() =>
    this.buckets().some((bucket) => bucket.orders > 0 || bucket.sales > 0),
  );
  private readonly top = computed(() =>
    niceMax(Math.max(0, ...this.buckets().map((bucket) => this.valueOf(bucket)))),
  );
  protected readonly ticks = computed(() => [0, this.top() / 2, this.top()]);
  protected readonly peakIndex = computed(() => {
    const values = this.buckets().map((bucket) => this.valueOf(bucket));
    const peak = Math.max(0, ...values);
    return peak > 0 ? values.indexOf(peak) : -1;
  });
  protected readonly axisStep = computed(() =>
    Math.max(1, Math.ceil(this.buckets().length / MAX_AXIS_LABELS)),
  );
  protected readonly hoveredBucket = computed(() => {
    const index = this.hovered();
    return index === null ? null : (this.buckets()[index] ?? null);
  });
  protected readonly tooltipLeft = computed(() => {
    const index = this.hovered() ?? 0;
    return ((index + 0.5) / Math.max(this.buckets().length, 1)) * 100;
  });
  protected readonly tooltipBottom = computed(() => {
    const bucket = this.hoveredBucket();
    return bucket === null ? 0 : this.heightOf(bucket);
  });
  protected readonly chartLabel = computed(
    () => `${this.metricName()} por ${this.unit()}. Cada barra es una ${this.unit()}.`,
  );

  protected setMetric(value: string): void {
    this.metric.set(value === 'orders' ? 'orders' : 'sales');
    this.hovered.set(null);
  }

  protected valueOf(bucket: TrendBucket): number {
    return this.metric() === 'sales' ? bucket.sales : bucket.orders;
  }

  protected heightOf(bucket: TrendBucket): number {
    return (this.valueOf(bucket) / this.top()) * 100;
  }

  protected format(value: number): string {
    return this.metric() === 'sales'
      ? PRICE.transform(value).replace(/\.00$/, '')
      : String(Math.round(value));
  }

  protected price(value: number): string {
    return PRICE.transform(value);
  }

  /** What a screen reader says for a bar: the hour or day with both numbers. */
  protected describe(bucket: TrendBucket): string {
    const orders = bucket.orders === 1 ? '1 pedido' : `${bucket.orders} pedidos`;
    return `${bucket.label}: ${orders}, ventas ${PRICE.transform(bucket.sales)}`;
  }
}
