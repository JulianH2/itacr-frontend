import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { toInstants } from '../../models/date-range';
import type { TrendPoint } from '../../models/manager.models';
import { SalesTrendChartComponent } from './sales-trend-chart.component';

const TODAY = toInstants({ start: '2026-11-10', end: '2026-11-10' });
const POINTS: readonly TrendPoint[] = [
  { hourStart: new Date(2026, 10, 10, 12).toISOString(), orders: 3, sales: 100 },
  { hourStart: new Date(2026, 10, 10, 13).toISOString(), orders: 0, sales: 130 },
];

describe('SalesTrendChartComponent', () => {
  let fixture: ComponentFixture<SalesTrendChartComponent>;
  let chart: HTMLElement;

  async function render(points: readonly TrendPoint[] = POINTS, range = TODAY): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [SalesTrendChartComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SalesTrendChartComponent);
    fixture.componentRef.setInput('points', points);
    fixture.componentRef.setInput('from', range.from);
    fixture.componentRef.setInput('to', range.to);
    await settle();
    chart = fixture.nativeElement as HTMLElement;
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function byTestId(testId: string): HTMLElement | null {
    return chart.querySelector(`[data-testid="${testId}"]`);
  }

  function bars(): HTMLElement[] {
    return Array.from(chart.querySelectorAll<HTMLElement>('.slot__hit'));
  }

  it('should draw one bar for each hour of the day', async () => {
    // Act
    await render();

    // Assert
    expect(bars()).toHaveLength(24);
  });

  it('should draw the bar of the highest value full height and the others in proportion', async () => {
    // Act
    await render();

    // Assert: the scale tops at 200 for sales of 100 and 130, so the highest bar is 65%
    const heights = bars().map((bar) => bar.querySelector<HTMLElement>('.bar')?.style.height);
    expect(heights[12]).toBe('50%');
    expect(heights[13]).toBe('65%');
    expect(heights[0]).toBe('0%');
  });

  it('should label only the highest bar with its value', async () => {
    // Act
    await render();

    // Assert
    const labels = chart.querySelectorAll('.bar__label');
    expect(labels).toHaveLength(1);
    expect(labels[0].textContent).toContain('$130');
  });

  it('should show the value and the hour of a bar when the pointer is over it, and hide them when it leaves', async () => {
    // Arrange
    await render();
    const slot = bars()[12].parentElement as HTMLElement;

    // Act
    slot.dispatchEvent(new Event('pointerenter'));
    await settle();

    // Assert
    expect(byTestId('trend-tooltip')?.textContent).toContain('$100');
    slot.dispatchEvent(new Event('pointerleave'));
    await settle();
    expect(byTestId('trend-tooltip')).toBeNull();
  });

  it('should show the same value when the bar gets the keyboard focus', async () => {
    // Arrange
    await render();

    // Act
    bars()[13].dispatchEvent(new Event('focus'));
    await settle();

    // Assert
    expect(byTestId('trend-tooltip')?.textContent).toContain('$130');
  });

  it('should give every bar a name a screen reader can say', async () => {
    // Act
    await render();

    // Assert
    expect(bars()[12].getAttribute('aria-label')).toContain('3 pedidos, ventas $100.00');
  });

  it('should draw the orders instead of the sales when the measure is changed', async () => {
    // Arrange
    await render();

    // Act
    (byTestId('trend-metric-orders') as HTMLButtonElement).click();
    await settle();

    // Assert: the scale tops at 5 for 3 orders, so the bar is 60%
    expect(chart.querySelector('.bar__label')?.textContent?.trim()).toBe('3');
    expect(bars()[12].querySelector<HTMLElement>('.bar')?.style.height).toBe('60%');
  });

  it('should show the same numbers as a table', async () => {
    // Arrange
    await render();

    // Act
    (byTestId('trend-table-toggle') as HTMLButtonElement).click();
    await settle();

    // Assert
    const rows = chart.querySelectorAll('[data-testid="trend-table"] tbody tr');
    expect(rows).toHaveLength(24);
    expect(rows[12].textContent).toContain('3');
    expect(rows[12].textContent).toContain('$100.00');
    expect(byTestId('trend-chart')).toBeNull();
  });

  it('should say there are no orders when the range had none', async () => {
    // Act
    await render([]);

    // Assert
    expect(byTestId('trend-empty')?.textContent).toContain('No hay pedidos en este rango.');
    expect(byTestId('trend-chart')).toBeNull();
  });

  it('should draw a bar for each day when the range is long', async () => {
    // Arrange
    const week = toInstants({ start: '2026-11-04', end: '2026-11-10' });

    // Act
    await render(POINTS, week);

    // Assert
    expect(bars()).toHaveLength(7);
  });

  it('should dim itself while new numbers load', async () => {
    // Arrange
    await render();

    // Act
    fixture.componentRef.setInput('refreshing', true);
    await settle();

    // Assert
    expect(chart.querySelector('.trend--refreshing')).not.toBeNull();
  });

  it('should title the table by day when the range is long', async () => {
    // Arrange
    await render(POINTS, toInstants({ start: '2026-11-04', end: '2026-11-10' }));

    // Act
    (byTestId('trend-table-toggle') as HTMLButtonElement).click();
    await settle();

    // Assert
    expect(chart.querySelector('[data-testid="trend-table"] thead')?.textContent).toContain('Día');
  });

  it('should go back to the sales when that measure is chosen again', async () => {
    // Arrange
    await render();
    (byTestId('trend-metric-orders') as HTMLButtonElement).click();
    await settle();

    // Act
    (byTestId('trend-metric-sales') as HTMLButtonElement).click();
    await settle();

    // Assert
    expect(bars()[13].querySelector<HTMLElement>('.bar')?.style.height).toBe('65%');
  });

  describe('scale and state', () => {
    interface ChartState {
      metric: { set(value: 'sales' | 'orders'): void };
      hovered: { set(value: number | null): void };
      ticks(): readonly number[];
      peakIndex(): number;
      isDaily(): boolean;
      hoveredBucket(): unknown;
      tooltipLeft(): number;
      tooltipBottom(): number;
    }

    function state(): ChartState {
      return fixture.componentInstance as unknown as ChartState;
    }

    function point(hour: number, orders: number, sales: number): TrendPoint {
      return { hourStart: new Date(2026, 10, 10, hour).toISOString(), orders, sales };
    }

    it.each([
      [100, 100],
      [300, 500],
      [700, 1000],
    ])('should round a highest value of %s up to a scale of %s', async (sales, top) => {
      // Act
      await render([point(12, 2, sales)]);

      // Assert
      expect(state().ticks()).toEqual([0, top / 2, top]);
    });

    it('should keep a scale of 1 and no peak when the range has no numbers', async () => {
      // Act
      await render([]);

      // Assert
      expect(state().ticks()).toEqual([0, 0.5, 1]);
      expect(state().peakIndex()).toBe(-1);
    });

    it('should not count a range of a single hour as daily', async () => {
      // Arrange
      const from = new Date(2026, 10, 10, 12);
      const to = new Date(2026, 10, 10, 13);

      // Act
      await render([point(12, 1, 50)], { from: from.toISOString(), to: to.toISOString() });

      // Assert
      expect(state().isDaily()).toBe(false);
      expect(bars()[0]?.getAttribute('aria-label')).toContain('1 pedido,');
    });

    it('should place no tooltip when no bar, or a bar that does not exist, is hovered', async () => {
      // Arrange
      await render();

      // Act / Assert
      expect(state().hoveredBucket()).toBeNull();
      expect(state().tooltipBottom()).toBe(0);
      expect(state().tooltipLeft()).toBeCloseTo((0.5 / 24) * 100);
      state().hovered.set(99);
      expect(state().hoveredBucket()).toBeNull();
    });
  });
});
