import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY, of } from 'rxjs';

import type { RecentOrder } from '../../models/take-order.models';
import { ORDERS_API, type OrdersApi } from '../../services/orders-api';
import { TakeOrderStore } from '../../services/take-order-store.service';
import { WaiterDashboardPageComponent } from './waiter-dashboard-page.component';

const RECENT: readonly RecentOrder[] = [
  {
    id: 'order-2',
    orderNumber: 13,
    channel: 'TakeAway',
    status: 'Ready',
    tableNumber: null,
    createdAt: '2026-10-14T18:05:00Z',
  },
  {
    id: 'order-1',
    orderNumber: 12,
    channel: 'DineIn',
    status: 'InPreparation',
    tableNumber: 5,
    createdAt: '2026-10-14T18:00:00Z',
  },
];

async function render(recent: readonly RecentOrder[]): Promise<HTMLElement> {
  const api: OrdersApi = {
    getDiningTables: () => of([]),
    createOrder: () => EMPTY,
    getOrder: () => EMPTY,
    getRecentOrders: () => of(recent),
  };
  await TestBed.configureTestingModule({
    imports: [WaiterDashboardPageComponent],
    providers: [provideRouter([]), TakeOrderStore, { provide: ORDERS_API, useValue: api }],
  }).compileComponents();
  const fixture = TestBed.createComponent(WaiterDashboardPageComponent);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('WaiterDashboardPageComponent', () => {
  it('should list the last orders with their status and link each one to its detail', async () => {
    // Act
    const page = await render(RECENT);

    // Assert
    const links = Array.from(
      page.querySelectorAll<HTMLAnchorElement>('[data-testid="recent-order"]'),
    );
    expect(
      links.map((link) => link.querySelector('.dashboard__recent-title')?.textContent?.trim()),
    ).toEqual(['Orden #13 · Para llevar', 'Orden #12 · Mesa 5']);
    expect(links[1]?.textContent).toContain('En preparación');
    expect(links[1]?.getAttribute('href')).toBe('/orders/detail/order-1');
  });

  it('should not show the section when the waiter has sent no orders', async () => {
    // Act
    const page = await render([]);

    // Assert
    expect(page.textContent).not.toContain('Últimos pedidos');
  });
});
