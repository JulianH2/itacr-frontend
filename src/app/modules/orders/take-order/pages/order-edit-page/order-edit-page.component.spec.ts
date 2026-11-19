import { HttpErrorResponse } from '@angular/common/http';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { EMPTY, type Observable, of, throwError } from 'rxjs';

import { ToastService } from '@shared/services/toast.service';
import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import type { OrderDetail, UpdateOrderRequest } from '../../models/take-order.models';
import { OrderEditStore } from '../../services/order-edit-store.service';
import { ORDERS_API, type OrdersApi } from '../../services/orders-api';
import { TakeOrderStore } from '../../services/take-order-store.service';
import { OrderEditPageComponent } from './order-edit-page.component';

const DETAIL: OrderDetail = {
  id: 'order-1',
  orderNumber: 12,
  channel: 'DineIn',
  status: 'InPreparation',
  tableNumber: 5,
  total: 108,
  createdAt: '2026-11-12T18:00:00Z',
  readyAt: null,
  deliveredAt: null,
  modifiedAt: null,
  items: [
    { productId: 'burger', name: 'Hamburguesa Clásica', quantity: 1, unitPrice: 79, subtotal: 79 },
    { productId: 'soda', name: 'Refresco de Cola', quantity: 1, unitPrice: 29, subtotal: 29 },
  ],
  notes: [],
  timeline: [{ status: 'New', changedAt: '2026-11-12T18:00:00Z', undone: false }],
};

interface Harness {
  readonly fixture: ComponentFixture<OrderEditPageComponent>;
  readonly page: HTMLElement;
  readonly updates: UpdateOrderRequest[];
  readonly navigate: ReturnType<typeof vi.spyOn>;
}

async function render(
  options: { order?: OrderDetail; updateError?: unknown } = {},
): Promise<Harness> {
  const updates: UpdateOrderRequest[] = [];
  const api: OrdersApi = {
    getDiningTables: () =>
      of([
        { id: 'table-5', number: 5 },
        { id: 'table-2', number: 2 },
      ]),
    createOrder: () => EMPTY,
    getOrder: () => of(options.order ?? DETAIL),
    updateOrder: (_id, request): Observable<OrderDetail> => {
      updates.push(request);
      return options.updateError === undefined
        ? of({ ...DETAIL, total: 137 })
        : throwError(() => options.updateError);
    },
    getActiveOrders: () => of([]),
    deliverOrder: () => EMPTY,
    getReadyPickupOrders: () => of([]),
  };
  await TestBed.configureTestingModule({
    imports: [OrderEditPageComponent],
    providers: [
      provideRouter([]),
      TakeOrderStore,
      OrderEditStore,
      { provide: ORDERS_API, useValue: api },
    ],
  }).compileComponents();
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(OrderEditPageComponent);
  fixture.componentRef.setInput('id', 'order-1');
  await fixture.whenStable();
  return { fixture, page: fixture.nativeElement as HTMLElement, updates, navigate };
}

function byTestId(page: HTMLElement, testId: string): HTMLElement | null {
  return page.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
}

async function press(harness: Harness, testId: string): Promise<void> {
  byTestId(harness.page, testId)?.click();
  await harness.fixture.whenStable();
}

describe('OrderEditPageComponent', () => {
  it('should show the products, the table, and the total of the order', async () => {
    // Act
    const { page } = await render();

    // Assert
    expect(byTestId(page, 'edit-title')?.textContent).toContain('Modificar orden #12');
    expect(page.textContent).toContain('Hamburguesa Clásica');
    expect(page.textContent).toContain('Refresco de Cola');
    expect(byTestId(page, 'edit-total')?.textContent).toContain('$108.00');
    expect(page.querySelector('.summary__table--selected')?.textContent?.trim()).toBe('Mesa 5');
  });

  it('should recalculate the total when a quantity changes and when a line is removed', async () => {
    // Arrange
    const harness = await render();
    const draft = TestBed.inject(OrderDraftService);

    // Act
    draft.changeQuantity('soda', 3);
    await harness.fixture.whenStable();

    // Assert
    expect(byTestId(harness.page, 'edit-total')?.textContent).toContain('$166.00');
    draft.remove('burger');
    await harness.fixture.whenStable();
    expect(byTestId(harness.page, 'edit-total')?.textContent).toContain('$87.00');
  });

  it('should save the changes, tell the waiter, and go back to the detail (CA1)', async () => {
    // Arrange
    const harness = await render();
    const toast = TestBed.inject(ToastService);
    TestBed.inject(OrderDraftService).add({ productId: 'nuggets', name: 'Nuggets', unitPrice: 55 });
    harness.fixture.detectChanges();

    // Act
    await press(harness, 'save-edit');

    // Assert
    expect(harness.updates).toHaveLength(1);
    expect(harness.updates[0].items.map((item) => item.productId)).toEqual([
      'burger',
      'soda',
      'nuggets',
    ]);
    expect(toast.toasts()[0].title).toBe('Orden modificada');
    expect(harness.navigate).toHaveBeenCalledWith(['/orders', 'detail', 'order-1']);
  });

  it('should leave the order untouched and go back to the detail when the waiter cancels (CA3)', async () => {
    // Arrange
    const harness = await render();
    TestBed.inject(OrderDraftService).add({ productId: 'nuggets', name: 'Nuggets', unitPrice: 55 });
    harness.fixture.detectChanges();

    // Act
    await press(harness, 'cancel-edit');

    // Assert
    expect(harness.updates).toEqual([]);
    expect(TestBed.inject(OrderDraftService).items()).toEqual([]);
    expect(harness.navigate).toHaveBeenCalledWith(['/orders', 'detail', 'order-1']);
  });

  it('should not allow saving an order without products and explain why', async () => {
    // Arrange
    const harness = await render();
    const draft = TestBed.inject(OrderDraftService);

    // Act
    draft.remove('burger');
    draft.remove('soda');
    await harness.fixture.whenStable();

    // Assert
    expect(byTestId(harness.page, 'save-edit')?.hasAttribute('disabled')).toBe(true);
    expect(byTestId(harness.page, 'edit-notice')?.textContent).toContain(
      'no puede quedarse sin productos',
    );
  });

  it('should show the message of the server and go back to the detail when the order changed meanwhile', async () => {
    // Arrange
    const harness = await render({
      updateError: new HttpErrorResponse({
        status: 409,
        error: { detail: 'El pedido ya no se puede modificar porque cocina lo marcó como listo.' },
      }),
    });

    // Act
    await press(harness, 'save-edit');

    // Assert
    expect(TestBed.inject(ToastService).toasts()[0].message).toContain(
      'cocina lo marcó como listo',
    );
    expect(harness.navigate).toHaveBeenCalledWith(['/orders', 'detail', 'order-1']);
  });

  it('should not offer the form for an order that is Ready', async () => {
    // Act
    const { page } = await render({ order: { ...DETAIL, status: 'Ready' } });

    // Assert
    expect(byTestId(page, 'edit-problem')?.textContent).toContain('ya no se puede modificar');
    expect(byTestId(page, 'save-edit')).toBeNull();
  });
});
