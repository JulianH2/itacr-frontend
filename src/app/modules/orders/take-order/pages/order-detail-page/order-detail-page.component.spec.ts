import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { type Observable, EMPTY, of, throwError } from 'rxjs';

import type { OrderDetail } from '../../models/take-order.models';
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
  items: [{ name: 'Hamburguesa Clásica', quantity: 2, unitPrice: 79, subtotal: 158 }],
  timeline: [
    { status: 'New', changedAt: '2026-10-14T18:00:00Z', undone: false },
    { status: 'InPreparation', changedAt: '2026-10-14T18:02:00Z', undone: false },
    { status: 'Ready', changedAt: '2026-10-14T18:09:00Z', undone: false },
    { status: 'InPreparation', changedAt: '2026-10-14T18:09:05Z', undone: true },
  ],
};

describe('OrderDetailPageComponent', () => {
  let getOrder: ReturnType<typeof vi.fn<(orderId: string) => Observable<OrderDetail>>>;

  async function render(): Promise<HTMLElement> {
    const api: OrdersApi = {
      getDiningTables: () => EMPTY,
      createOrder: () => EMPTY,
      getOrder,
      getRecentOrders: () => of([]),
    };
    await TestBed.configureTestingModule({
      imports: [OrderDetailPageComponent],
      providers: [provideRouter([]), { provide: ORDERS_API, useValue: api }],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderDetailPageComponent);
    fixture.componentRef.setInput('id', 'order-1');
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    getOrder = vi.fn(() => of(DETAIL));
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
});
