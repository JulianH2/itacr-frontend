import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY, of } from 'rxjs';

import { ConnectionStatusService } from '@shared/services/connection-status.service';

import type { PendingOrder, RecentOrder } from '../../models/take-order.models';
import { OfflineOrdersService } from '../../services/offline-orders.service';
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

function pendingOrder(
  clientOrderId: string,
  state: PendingOrder['state'] = 'pending',
): PendingOrder {
  return {
    clientOrderId,
    employeeId: 'waiter-1',
    request: {
      clientOrderId,
      tableId: 'table-5',
      takeAway: false,
      items: [{ productId: 'burger', quantity: 2 }],
      createdAt: '2026-10-22T18:00:00Z',
    },
    tableNumber: 5,
    itemCount: 2,
    total: 158,
    state,
    error: state === 'failed' ? 'Uno o más productos ya no están en el menú.' : null,
  };
}

const offlineOrders = {
  orders: signal<readonly PendingOrder[]>([]),
  pendingCount: computed(() => 0),
  discard: vi.fn(() => Promise.resolve()),
};

async function render(
  recent: readonly RecentOrder[],
  unsent: readonly PendingOrder[] = [],
  online = true,
): Promise<HTMLElement> {
  offlineOrders.orders.set(unsent);
  offlineOrders.pendingCount = computed(
    () => offlineOrders.orders().filter((order) => order.state === 'pending').length,
  );
  const api: OrdersApi = {
    getDiningTables: () => of([]),
    createOrder: () => EMPTY,
    getOrder: () => EMPTY,
    getRecentOrders: () => of(recent),
  };
  await TestBed.configureTestingModule({
    imports: [WaiterDashboardPageComponent],
    providers: [
      provideRouter([]),
      TakeOrderStore,
      { provide: ORDERS_API, useValue: api },
      { provide: OfflineOrdersService, useValue: offlineOrders },
      { provide: ConnectionStatusService, useValue: { online: signal(online) } },
    ],
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

  // HU_07
  it('should show the connection and that every order is in the kitchen when nothing is pending', async () => {
    // Act
    const page = await render([]);

    // Assert
    const status = page.querySelector('[data-testid="sync-status"]')?.textContent ?? '';
    expect(status).toContain('En línea');
    expect(status).toContain('Todos tus pedidos están en cocina');
    expect(page.querySelector('[data-testid="unsent-order"]')).toBeNull();
  });

  // HU_07 CA1
  it('should count and list the orders waiting for the connection', async () => {
    // Act
    const page = await render([], [pendingOrder('a'), pendingOrder('b')], false);

    // Assert
    const status = page.querySelector('[data-testid="sync-status"]')?.textContent ?? '';
    expect(status).toContain('Sin conexión');
    expect(status).toContain('2 pedidos pendientes de sincronizar');
    const unsent = page.querySelectorAll('[data-testid="unsent-order"]');
    expect(unsent).toHaveLength(2);
    expect(unsent[0]?.textContent).toContain('Mesa 5 · 2 productos');
    expect(unsent[0]?.textContent).toContain('Pendiente de sincronizar');
  });

  it('should let the waiter discard an order the API rejected', async () => {
    // Arrange
    const page = await render([], [pendingOrder('a', 'failed')]);
    const unsent = page.querySelector('[data-testid="unsent-order"]');

    // Act
    unsent?.querySelector<HTMLButtonElement>('[data-testid="discard-order"]')?.click();

    // Assert
    expect(unsent?.textContent).toContain('No se pudo enviar');
    expect(unsent?.textContent).toContain('Uno o más productos ya no están en el menú.');
    expect(page.querySelector('[data-testid="sync-status"]')?.textContent).toContain(
      'Revisa los pedidos que no se pudieron enviar',
    );
    expect(offlineOrders.discard).toHaveBeenCalledWith('a');
  });
});
