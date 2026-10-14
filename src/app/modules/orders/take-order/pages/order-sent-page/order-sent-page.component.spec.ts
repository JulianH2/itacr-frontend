import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { EMPTY, of } from 'rxjs';

import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import type { PlacedOrder } from '../../models/take-order.models';
import { ORDERS_API, type OrdersApi } from '../../services/orders-api';
import { TakeOrderStore } from '../../services/take-order-store.service';
import { OrderSentPageComponent } from './order-sent-page.component';

const SENT_ORDER: PlacedOrder = {
  id: 'order-1',
  clientOrderId: 'client-1',
  orderNumber: 7,
  status: 'New',
  channel: 'DineIn',
  tableNumber: 5,
  total: 79,
  createdAt: '2026-10-09T12:00:00Z',
  items: [],
};

const API: OrdersApi = {
  getDiningTables: () => of([{ id: 'table-5', number: 5 }]),
  createOrder: () => of(SENT_ORDER),
  getOrder: () => EMPTY,
  getRecentOrders: () => of([]),
};

describe('OrderSentPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderSentPageComponent],
      providers: [provideRouter([]), TakeOrderStore, { provide: ORDERS_API, useValue: API }],
    }).compileComponents();
  });

  async function sendOrder(): Promise<void> {
    const store = TestBed.inject(TakeOrderStore);
    TestBed.inject(OrderDraftService).add({
      productId: 'burger',
      name: 'Hamburguesa',
      unitPrice: 79,
    });
    store.selectTable('table-5');
    await store.send();
  }

  it('should show the order number and its table when the order was sent', async () => {
    // Arrange
    await sendOrder();

    // Act
    const fixture = TestBed.createComponent(OrderSentPageComponent);
    await fixture.whenStable();

    // Assert
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Orden #7');
    expect(text).toContain('Mesa 5');
  });

  // CA4
  it('should go back to the dashboard with an empty order when "Tomar nuevo pedido" is tapped', async () => {
    // Arrange
    await sendOrder();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(OrderSentPageComponent);
    await fixture.whenStable();
    TestBed.inject(OrderDraftService).add({ productId: 'soda', name: 'Refresco', unitPrice: 29 });

    // Act
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    button?.click();
    await fixture.whenStable();

    // Assert
    expect(navigate).toHaveBeenCalledWith('/orders');
    expect(TestBed.inject(OrderDraftService).itemCount()).toBe(0);
    expect(TestBed.inject(TakeOrderStore).sentOrder()).toBeNull();
  });

  it('should go to the dashboard when there is no sent order to show', async () => {
    // Arrange
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    // Act
    const fixture = TestBed.createComponent(OrderSentPageComponent);
    await fixture.whenStable();

    // Assert
    expect(navigate).toHaveBeenCalledWith('/orders');
  });
});
