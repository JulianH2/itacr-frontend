import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { type Observable, EMPTY, NEVER, of, throwError } from 'rxjs';

import { EmployeeRole } from '@shared/auth/auth.models';
import { SessionService } from '@shared/auth/session.service';
import { ToastService } from '@shared/services/toast.service';

import type { DeliveredOrder, OrderDetail } from '../../models/take-order.models';
import { ORDERS_API, type OrdersApi } from '../../services/orders-api';
import { ORDER_DETAIL_REFRESH_MS, OrderDetailPageComponent } from './order-detail-page.component';

const DETAIL: OrderDetail = {
  id: 'order-1',
  orderNumber: 12,
  channel: 'DineIn',
  status: 'InPreparation',
  tableNumber: 5,
  total: 158,
  createdAt: '2026-10-14T18:00:00Z',
  readyAt: null,
  deliveredAt: null,
  items: [{ name: 'Hamburguesa Clásica', quantity: 2, unitPrice: 79, subtotal: 158 }],
  timeline: [
    { status: 'New', changedAt: '2026-10-14T18:00:00Z', undone: false },
    { status: 'InPreparation', changedAt: '2026-10-14T18:02:00Z', undone: false },
    { status: 'Ready', changedAt: '2026-10-14T18:09:00Z', undone: false },
    { status: 'InPreparation', changedAt: '2026-10-14T18:09:05Z', undone: true },
  ],
};

const READY: OrderDetail = {
  ...DETAIL,
  status: 'Ready',
  readyAt: '2026-10-14T18:09:00Z',
  timeline: [
    { status: 'New', changedAt: '2026-10-14T18:00:00Z', undone: false },
    { status: 'InPreparation', changedAt: '2026-10-14T18:02:00Z', undone: false },
    { status: 'Ready', changedAt: '2026-10-14T18:09:00Z', undone: false },
  ],
};

const DELIVERED: OrderDetail = {
  ...READY,
  status: 'Delivered',
  deliveredAt: '2026-10-14T18:25:00Z',
  timeline: [
    ...READY.timeline,
    { status: 'Delivered', changedAt: '2026-10-14T18:25:00Z', undone: false },
  ],
};

const DELIVERY_DONE: DeliveredOrder = {
  id: 'order-1',
  status: 'Delivered',
  deliveredAt: '2026-10-14T18:25:00Z',
};

describe('OrderDetailPageComponent', () => {
  let getOrder: ReturnType<typeof vi.fn<(orderId: string) => Observable<OrderDetail>>>;
  let deliverOrder: ReturnType<typeof vi.fn<(orderId: string) => Observable<DeliveredOrder>>>;

  async function render(role: EmployeeRole = EmployeeRole.Waiter): Promise<HTMLElement> {
    const api: OrdersApi = {
      getDiningTables: () => EMPTY,
      createOrder: () => EMPTY,
      getOrder,
      getActiveOrders: () => of([]),
      deliverOrder,
      getReadyPickupOrders: () => of([]),
    };
    await TestBed.configureTestingModule({
      imports: [OrderDetailPageComponent],
      providers: [
        provideRouter([]),
        { provide: ORDERS_API, useValue: api },
        {
          provide: SessionService,
          useValue: { employee: signal({ id: 'employee-1', displayName: 'Ana', role }) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderDetailPageComponent);
    fixture.componentRef.setInput('id', 'order-1');
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    getOrder = vi.fn(() => of(DETAIL));
    deliverOrder = vi.fn(() => of(DELIVERY_DONE));
  });

  // CA4
  it('should show the current status and every step of the timeline when the waiter opens the order', async () => {
    // Act
    const page = await render();

    // Assert
    expect(getOrder).toHaveBeenCalledWith('order-1');
    expect(page.querySelector('[data-testid="order-status"]')?.textContent?.trim()).toBe(
      'En preparación',
    );
    const steps = Array.from(page.querySelectorAll('.detail__step-text')).map((step) =>
      step.textContent?.trim(),
    );
    expect(steps).toEqual(['Nuevo', 'En preparación', 'Listo', 'Regresó a En preparación']);
    expect(page.textContent).toContain('Mesa 5');
    expect(page.textContent).toContain('2× Hamburguesa Clásica');
  });

  it('should ask the API again every few seconds, so the kitchen changes show up', async () => {
    // Arrange
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    await render();
    getOrder.mockClear();

    // Act
    await vi.advanceTimersByTimeAsync(ORDER_DETAIL_REFRESH_MS);

    // Assert
    await vi.waitFor(() => expect(getOrder).toHaveBeenCalledTimes(1));
    vi.useRealTimers();
  });

  it('should say the order does not exist when the API answers 404', async () => {
    // Arrange
    getOrder = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 404 })));

    // Act
    const page = await render();

    // Assert
    expect(page.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'Este pedido no existe.',
    );
  });

  // HU_10 CA2
  it('should not offer to mark the order as delivered while it is in preparation', async () => {
    // Act
    const page = await render();

    // Assert
    expect(page.querySelector('[data-testid="deliver-order"]')).toBeNull();
  });

  // HU_10 CA1
  it('should mark the order as delivered and show it closed when the waiter taps the button', async () => {
    // Arrange
    getOrder = vi.fn().mockReturnValueOnce(of(READY)).mockReturnValue(of(DELIVERED));
    const page = await render();
    const toast = TestBed.inject(ToastService);

    // Act
    page.querySelector<HTMLButtonElement>('[data-testid="deliver-order"]')?.click();
    await vi.waitFor(() =>
      expect(page.querySelector('[data-testid="service-time"]')).not.toBeNull(),
    );

    // Assert
    expect(deliverOrder).toHaveBeenCalledWith('order-1');
    expect(page.querySelector('[data-testid="order-status"]')?.textContent?.trim()).toBe(
      'Entregado',
    );
    expect(page.querySelector('[data-testid="deliver-order"]')).toBeNull();
    expect(page.querySelector('[data-testid="service-time"]')?.textContent).toContain(
      'Tiempo total del servicio: 25 min',
    );
    expect(toast.toasts().map((item) => item.title)).toEqual(['Pedido entregado']);
  });

  it('should not offer the button to a manager, even when the order is ready', async () => {
    // Arrange
    getOrder = vi.fn(() => of(READY));

    // Act
    const asManager = await render(EmployeeRole.Manager);

    // Assert
    expect(asManager.querySelector('[data-testid="deliver-order"]')).toBeNull();
  });

  it('should show the time of each stage of a delivered order', async () => {
    // Arrange
    getOrder = vi.fn(() => of(DELIVERED));

    // Act
    const page = await render();

    // Assert
    const steps = Array.from(page.querySelectorAll('.detail__step-text')).map((step) =>
      step.textContent?.trim(),
    );
    expect(steps).toEqual(['Nuevo', 'En preparación', 'Listo', 'Entregado']);
    expect(page.querySelector('[data-testid="deliver-order"]')).toBeNull();
    expect(page.querySelectorAll('.detail__step-time')).toHaveLength(4);
  });

  it('should say why the order could not be delivered and keep the button when the API answers a conflict', async () => {
    // Arrange
    getOrder = vi.fn(() => of(READY));
    deliverOrder = vi.fn(() =>
      throwError(
        () =>
          new HttpErrorResponse({ status: 409, error: { detail: 'El pedido ya fue entregado.' } }),
      ),
    );
    const page = await render();

    // Act
    page.querySelector<HTMLButtonElement>('[data-testid="deliver-order"]')?.click();
    await vi.waitFor(() =>
      expect(page.querySelector('[data-testid="deliver-error"]')).not.toBeNull(),
    );

    // Assert
    expect(page.querySelector('[data-testid="deliver-error"]')?.textContent?.trim()).toBe(
      'El pedido ya fue entregado.',
    );
    expect(page.querySelector<HTMLButtonElement>('[data-testid="deliver-order"]')?.disabled).toBe(
      false,
    );
  });

  it('should ask to check the connection when delivering fails without a network', async () => {
    // Arrange
    getOrder = vi.fn(() => of(READY));
    deliverOrder = vi.fn(() => throwError(() => new HttpErrorResponse({ status: 0 })));
    const page = await render();

    // Act
    page.querySelector<HTMLButtonElement>('[data-testid="deliver-order"]')?.click();
    await vi.waitFor(() =>
      expect(page.querySelector('[data-testid="deliver-error"]')).not.toBeNull(),
    );

    // Assert
    expect(page.querySelector('[data-testid="deliver-error"]')?.textContent).toContain(
      'Revisa tu conexión',
    );
  });

  it('should not send the delivery twice when the waiter taps again while it is in progress', async () => {
    // Arrange
    getOrder = vi.fn(() => of(READY));
    deliverOrder = vi.fn(() => NEVER);
    const page = await render();
    const button = page.querySelector<HTMLButtonElement>('[data-testid="deliver-order"]');

    // Act
    button?.click();
    button?.click();

    // Assert
    expect(deliverOrder).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(button?.disabled).toBe(true));
  });
});
