import { ApplicationRef, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY, type Observable, of, throwError } from 'rxjs';

import { ConnectionStatusService } from '@shared/services/connection-status.service';

import type { PendingOrder, ActiveOrder } from '../../models/take-order.models';
import { OfflineOrdersService } from '../../services/offline-orders.service';
import { ORDERS_API, type OrdersApi } from '../../services/orders-api';
import { TakeOrderStore } from '../../services/take-order-store.service';
import { WaiterDashboardPageComponent } from './waiter-dashboard-page.component';

const ACTIVE: readonly ActiveOrder[] = [
  {
    id: 'order-2',
    orderNumber: 13,
    channel: 'TakeAway',
    status: 'Ready',
    tableNumber: null,
    createdAt: '2026-10-14T18:05:00Z',
    lastStatusChangeAt: '2026-10-14T18:20:00Z',
  },
  {
    id: 'order-1',
    orderNumber: 12,
    channel: 'DineIn',
    status: 'InPreparation',
    tableNumber: 5,
    createdAt: '2026-10-14T18:00:00Z',
    lastStatusChangeAt: '2026-10-14T18:03:00Z',
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
  active: readonly ActiveOrder[] | Observable<readonly ActiveOrder[]>,
  unsent: readonly PendingOrder[] = [],
  online = true,
  getActiveOrders: OrdersApi['getActiveOrders'] | null = null,
  pickups: readonly ActiveOrder[] = [],
): Promise<HTMLElement> {
  offlineOrders.orders.set(unsent);
  offlineOrders.pendingCount = computed(
    () => offlineOrders.orders().filter((order) => order.state === 'pending').length,
  );
  const api: OrdersApi = {
    getDiningTables: () => of([]),
    createOrder: () => EMPTY,
    getOrder: () => EMPTY,
    deliverOrder: () => EMPTY,
    getReadyPickupOrders: () => of(pickups),
    getActiveOrders:
      getActiveOrders ??
      (() => (Array.isArray(active) ? of(active) : (active as Observable<never>))),
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

function ids(page: HTMLElement): (string | undefined)[] {
  return Array.from(page.querySelectorAll('[data-testid="active-order"]')).map((link) =>
    link.querySelector('.dashboard__recent-title')?.textContent?.trim(),
  );
}

describe('WaiterDashboardPageComponent', () => {
  // HU_08
  it('should list the active orders with their status and link each one to its detail', async () => {
    // Act
    const page = await render(ACTIVE);

    // Assert
    expect(ids(page)).toEqual(['Orden #13 · Para llevar', 'Orden #12 · Mesa 5']);
    const links = page.querySelectorAll<HTMLAnchorElement>('[data-testid="active-order"]');
    expect(links[0]?.textContent).toContain('Listo desde');
    expect(links[1]?.textContent).toContain('En preparación');
    expect(links[1]?.getAttribute('href')).toBe('/orders/detail/order-1');
  });

  // HU_08
  it('should count the active, ready and pending orders', async () => {
    // Act
    const page = await render(ACTIVE, [pendingOrder('a')]);

    // Assert
    const values = Array.from(page.querySelectorAll('[data-testid="stats"] .stat__value')).map(
      (value) => value.textContent?.trim(),
    );
    expect(values).toEqual(['2', '1', '1']);
  });

  // HU_08
  it('should filter the orders by kitchen and ready', async () => {
    // Arrange
    const page = await render(ACTIVE);

    // Act
    page.querySelector<HTMLButtonElement>('[data-testid="filter-ready"]')?.click();
    await TestBed.inject(ApplicationRef).whenStable();

    // Assert
    expect(ids(page)).toEqual(['Orden #13 · Para llevar']);

    // Act
    page.querySelector<HTMLButtonElement>('[data-testid="filter-kitchen"]')?.click();
    await TestBed.inject(ApplicationRef).whenStable();

    // Assert
    expect(ids(page)).toEqual(['Orden #12 · Mesa 5']);
  });

  // HU_08
  it('should say the waiter has no active orders', async () => {
    // Act
    const page = await render([]);

    // Assert
    expect(page.querySelector('[data-testid="active-empty"]')?.textContent).toContain(
      'Aún no tienes pedidos activos.',
    );
  });

  // HU_08
  it('should say the orders could not be loaded and let the waiter retry', async () => {
    // Act
    const page = await render(throwError(() => new Error('offline')));

    // Assert
    expect(page.querySelector('[data-testid="active-error"]')?.textContent).toContain(
      'No pudimos actualizar tus pedidos.',
    );
    expect(page.querySelector('[data-testid="active-empty"]')).toBeNull();
    expect(page.querySelector('[data-testid="retry"]')).not.toBeNull();
  });

  // HU_08
  it('should ask for the active orders again when the page comes back to the front', async () => {
    // Arrange
    const getActiveOrders = vi.fn(() => of(ACTIVE));
    await render(ACTIVE, [], true, getActiveOrders);
    const calls = getActiveOrders.mock.calls.length;

    // Act
    document.dispatchEvent(new Event('visibilitychange'));
    await TestBed.inject(ApplicationRef).whenStable();

    // Assert
    expect(getActiveOrders.mock.calls.length).toBe(calls + 1);
  });

  // HU_08
  it('should not ask for the active orders while the page is hidden', async () => {
    // Arrange
    const getActiveOrders = vi.fn(() => of(ACTIVE));
    await render(ACTIVE, [], true, getActiveOrders);
    const calls = getActiveOrders.mock.calls.length;
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);

    // Act
    document.dispatchEvent(new Event('visibilitychange'));
    await TestBed.inject(ApplicationRef).whenStable();
    hidden.mockRestore();

    // Assert
    expect(getActiveOrders.mock.calls.length).toBe(calls);
  });

  // HU_08, ITACR-58
  it('should keep the list on screen with a notice when a refresh fails', async () => {
    // Arrange
    let calls = 0;
    const page = await render(ACTIVE, [], true, () =>
      ++calls === 1 ? of(ACTIVE) : throwError(() => new Error('offline')),
    );

    // Act
    document.dispatchEvent(new Event('visibilitychange'));
    await TestBed.inject(ApplicationRef).whenStable();

    // Assert
    expect(ids(page)).toEqual(['Orden #13 · Para llevar', 'Orden #12 · Mesa 5']);
    expect(page.querySelector('[data-testid="active-error"]')?.textContent).toContain(
      'Mostramos los últimos que cargaron.',
    );
    expect(page.querySelector('[data-testid="active-empty"]')).toBeNull();
  });

  // HU_08, ITACR-58
  it('should drop the notice when the next refresh works', async () => {
    // Arrange
    let calls = 0;
    const page = await render(ACTIVE, [], true, () =>
      ++calls === 2 ? throwError(() => new Error('offline')) : of(ACTIVE),
    );
    document.dispatchEvent(new Event('visibilitychange'));
    await TestBed.inject(ApplicationRef).whenStable();

    // Act
    document.dispatchEvent(new Event('visibilitychange'));
    await TestBed.inject(ApplicationRef).whenStable();

    // Assert
    expect(page.querySelector('[data-testid="active-error"]')).toBeNull();
    expect(ids(page)).toHaveLength(2);
  });

  // HU_10
  it('should list the pickup orders that are ready, so a waiter can hand one over', async () => {
    // Act
    const page = await render(ACTIVE, [], true, null, [
      {
        id: 'pickup-1',
        orderNumber: 21,
        channel: 'MobileApp',
        status: 'Ready',
        tableNumber: null,
        createdAt: '2026-10-14T17:50:00Z',
        lastStatusChangeAt: '2026-10-14T18:10:00Z',
      },
    ]);

    // Assert
    const links = Array.from(
      page.querySelectorAll<HTMLAnchorElement>('[data-testid="ready-pickup"]'),
    );
    expect(links).toHaveLength(1);
    expect(links[0]?.textContent).toContain('Orden #21 · Para recoger');
    expect(links[0]?.getAttribute('href')).toBe('/orders/detail/pickup-1');
  });

  // HU_10
  it('should not show the pickup section when no pickup order is waiting', async () => {
    // Act
    const page = await render(ACTIVE);

    // Assert
    expect(page.querySelector('[data-testid="ready-pickup"]')).toBeNull();
    expect(page.textContent).not.toContain('Para recoger (listos)');
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
