import { HttpErrorResponse } from '@angular/common/http';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { type Observable, of, throwError } from 'rxjs';

import { todayRange, toInstants } from '../models/date-range';
import type {
  ManagerDashboard,
  ManagerOrderRow,
  ManagerOrdersPage,
  ManagerOrdersQuery,
} from '../models/manager.models';
import { MANAGER_API, type ManagerApi } from '../services/manager-api';
import { ManagerDashboardStore } from '../services/manager-dashboard.store';
import { DashboardPageComponent } from './dashboard-page.component';

function order(
  number: number,
  channel: ManagerOrderRow['channel'],
  status: ManagerOrderRow['status'],
  seconds: number | null,
): ManagerOrderRow {
  return {
    id: `order-${number}`,
    orderNumber: number,
    channel,
    status,
    tableNumber: channel === 'DineIn' ? 5 : null,
    total: 100,
    createdAt: new Date(2026, 10, 10, 12, number).toISOString(),
    readyAt:
      seconds === null ? null : new Date(2026, 10, 10, 12, number + seconds / 60).toISOString(),
    deliveredAt: null,
    preparationSeconds: seconds,
  };
}

const ORDERS: readonly ManagerOrderRow[] = [
  order(14, 'MobileApp', 'Delivered', 1800),
  order(13, 'TakeAway', 'Delivered', 1200),
  order(12, 'MobileApp', 'New', null),
  order(11, 'DineIn', 'Delivered', 600),
];

function dashboard(slowest: 'Waiter' | 'Pickup' | null = 'Pickup'): ManagerDashboard {
  const range = toInstants(todayRange());
  return {
    ...range,
    totalOrders: 4,
    deliveredOrders: 3,
    sales: 260,
    channels: [
      {
        channel: 'Waiter',
        orders: 2,
        deliveredOrders: 2,
        sales: 150,
        preparedOrders: 2,
        averagePreparationSeconds: 900,
      },
      {
        channel: 'Pickup',
        orders: 2,
        deliveredOrders: 1,
        sales: 110,
        preparedOrders: 1,
        averagePreparationSeconds: 1800,
      },
    ],
    slowestChannel: slowest,
    trend: [{ hourStart: new Date(2026, 10, 10, 12).toISOString(), orders: 4, sales: 260 }],
  };
}

describe('DashboardPageComponent', () => {
  let getDashboard: ReturnType<
    typeof vi.fn<(from: string, to: string) => Observable<ManagerDashboard>>
  >;
  let getOrders: ReturnType<
    typeof vi.fn<(query: ManagerOrdersQuery) => Observable<ManagerOrdersPage>>
  >;
  let fixture: ComponentFixture<DashboardPageComponent>;
  let page: HTMLElement;

  async function render(): Promise<void> {
    const api: ManagerApi = { getDashboard, getOrders };
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: MANAGER_API, useValue: api },
        ManagerDashboardStore,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardPageComponent);
    await settle();
    page = fixture.nativeElement as HTMLElement;
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function byTestId(testId: string): HTMLElement | null {
    return page.querySelector(`[data-testid="${testId}"]`);
  }

  async function choose(testId: string, value: string): Promise<void> {
    const select = byTestId(testId) as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    await settle();
  }

  function rowNumbers(): string[] {
    return Array.from(page.querySelectorAll('[data-testid^="order-row-"]'), (row) =>
      (row.getAttribute('data-testid') ?? '').replace('order-row-', ''),
    );
  }

  beforeEach(() => {
    getDashboard = vi.fn(() => of(dashboard()));
    getOrders = vi.fn((query: ManagerOrdersQuery) =>
      of({
        page: query.page,
        pageSize: query.pageSize,
        totalCount: ORDERS.length,
        items: ORDERS.filter(
          (row) =>
            (query.channel === null ||
              (row.channel === 'MobileApp') === (query.channel === 'Pickup')) &&
            (query.status === null || row.status === query.status),
        ),
      }),
    );
  });

  it('should show the sales of the day and the average preparation time of each channel (CA1)', async () => {
    // Act
    await render();

    // Assert
    expect(page.textContent).toContain('$260.00');
    expect(page.textContent).toContain('3 pedidos entregados');
    expect(byTestId('channel-Waiter')?.textContent).toContain('15 min');
    expect(byTestId('channel-Pickup')?.textContent).toContain('30 min');
  });

  it('should ask for today, from the start of the day to the start of the next one, when it opens', async () => {
    // Act
    await render();

    // Assert
    const { from, to } = toInstants(todayRange());
    expect(getDashboard).toHaveBeenCalledWith(from, to);
    expect(getOrders).toHaveBeenCalledWith(
      expect.objectContaining({ from, to, channel: null, status: null, page: 1 }),
    );
  });

  it('should point to the channel with the longer average as the one with the biggest delay (CA3)', async () => {
    // Act
    await render();

    // Assert
    expect(
      byTestId('channel-Pickup')?.querySelector('[data-testid="slowest-channel"]')?.textContent,
    ).toContain('Mayor retraso');
    expect(byTestId('channel-Waiter')?.querySelector('[data-testid="slowest-channel"]')).toBeNull();
  });

  it('should point to no channel when the API has nothing to compare', async () => {
    // Arrange
    getDashboard.mockReturnValue(of(dashboard(null)));

    // Act
    await render();

    // Assert
    expect(byTestId('slowest-channel')).toBeNull();
  });

  it('should show only the orders of the pickup channel when the table is filtered by it (CA2)', async () => {
    // Arrange
    await render();
    expect(rowNumbers()).toEqual(['14', '13', '12', '11']);

    // Act
    await choose('filter-channel', 'Pickup');

    // Assert
    expect(getOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ channel: 'Pickup', page: 1 }),
    );
    expect(rowNumbers()).toEqual(['14', '12']);
  });

  it('should filter the table by status and keep the channel', async () => {
    // Arrange
    await render();
    await choose('filter-channel', 'Pickup');

    // Act
    await choose('filter-status', 'New');

    // Assert
    expect(getOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ channel: 'Pickup', status: 'New' }),
    );
    expect(rowNumbers()).toEqual(['12']);
  });

  it('should open the detail of the order from its row (CA4)', async () => {
    // Act
    await render();

    // Assert
    const link = byTestId('order-row-13')?.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/manager/orders/order-13');
  });

  it('should show the channel, the status, the total and the preparation time of each order', async () => {
    // Act
    await render();

    // Assert
    const row = byTestId('order-row-11')?.textContent ?? '';
    expect(row).toContain('Mesero · Mesa 5');
    expect(row).toContain('Entregado');
    expect(row).toContain('$100.00');
    expect(row).toContain('10 min');
    expect(byTestId('order-row-12')?.textContent).toContain('—');
  });

  it('should scope the numbers and the table to another range when the user picks it', async () => {
    // Arrange
    await render();

    // Act
    (byTestId('preset-Ayer') as HTMLButtonElement).click();
    await settle();

    // Assert
    expect(getDashboard).toHaveBeenCalledTimes(2);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getDashboard.mock.lastCall?.[0]).toBe(
      new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString(),
    );
    expect(byTestId('preset-Ayer')?.getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('preset-Hoy')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('should explain a range that is not valid and not ask the API for it', async () => {
    // Arrange
    await render();
    const calls = getDashboard.mock.calls.length;
    const end = byTestId('range-end') as HTMLInputElement;

    // Act
    end.value = '2020-01-01';
    end.dispatchEvent(new Event('change'));
    await settle();

    // Assert
    expect(byTestId('range-error')?.textContent).toContain(
      'La fecha inicial debe ser anterior a la final.',
    );
    expect(getDashboard.mock.calls.length).toBe(calls);
  });

  it('should keep the last numbers on screen and say so when a refresh fails', async () => {
    // Arrange
    await render();
    getDashboard.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));

    // Act
    (byTestId('preset-Ayer') as HTMLButtonElement).click();
    await settle();

    // Assert
    expect(byTestId('dashboard-error')?.textContent).toContain(
      'Mostramos los últimos que cargaron.',
    );
    expect(page.textContent).toContain('$260.00');
  });

  it('should say there are no orders when none matches', async () => {
    // Arrange
    getOrders.mockReturnValue(of({ page: 1, pageSize: 10, totalCount: 0, items: [] }));

    // Act
    await render();

    // Assert
    expect(page.textContent).toContain('No hay pedidos');
    expect(byTestId('orders-table')).toBeNull();
  });

  it('should page through the orders', async () => {
    // Arrange
    getOrders.mockImplementation((query: ManagerOrdersQuery) =>
      of({ page: query.page, pageSize: 10, totalCount: 25, items: ORDERS.slice(0, 2) }),
    );
    await render();
    expect(byTestId('orders-page')?.textContent).toContain('Página 1 de 3');
    expect((byTestId('orders-previous') as HTMLButtonElement).disabled).toBe(true);

    // Act
    (byTestId('orders-next') as HTMLButtonElement).click();
    await settle();

    // Assert
    expect(getOrders).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    expect(byTestId('orders-page')?.textContent).toContain('Página 2 de 3');
  });
});
