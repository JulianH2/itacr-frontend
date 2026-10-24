import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { EMPTY, of } from 'rxjs';

import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import type { CreateOrderRequest, PlacedOrder } from '../../models/take-order.models';
import { ORDERS_API, type OrdersApi } from '../../services/orders-api';
import { TakeOrderStore } from '../../services/take-order-store.service';
import { TAKE_ORDER_MESSAGES } from '../../take-order.messages';
import { OrderSummaryPageComponent } from './order-summary-page.component';

const SEND_LABEL = 'Enviar a cocina';

function createApi(requests: CreateOrderRequest[]): OrdersApi {
  return {
    getDiningTables: () => of([{ id: 'table-5', number: 5 }]),
    createOrder: (request) => {
      requests.push(request);
      const order: PlacedOrder = {
        id: 'order-1',
        clientOrderId: request.clientOrderId,
        orderNumber: 7,
        status: 'New',
        channel: 'DineIn',
        tableNumber: 5,
        total: 79,
        createdAt: '2026-10-09T12:00:00Z',
        items: [],
      };
      return of(order);
    },
    getOrder: () => EMPTY,
    getActiveOrders: () => of([]),
  };
}

async function render(
  requests: CreateOrderRequest[] = [],
): Promise<ComponentFixture<OrderSummaryPageComponent>> {
  await TestBed.configureTestingModule({
    imports: [OrderSummaryPageComponent],
    providers: [
      provideRouter([]),
      TakeOrderStore,
      { provide: ORDERS_API, useValue: createApi(requests) },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(OrderSummaryPageComponent);
  await fixture.whenStable();
  return fixture;
}

function findButton(
  fixture: ComponentFixture<OrderSummaryPageComponent>,
  text: string,
): HTMLButtonElement {
  const button = Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
  ).find((candidate) => candidate.textContent?.trim() === text);
  if (!button) {
    throw new Error(`Button "${text}" not found`);
  }
  return button;
}

async function click(
  fixture: ComponentFixture<OrderSummaryPageComponent>,
  text: string,
): Promise<void> {
  findButton(fixture, text).click();
  await fixture.whenStable();
}

describe('OrderSummaryPageComponent', () => {
  // CA3
  it('should disable "Enviar a cocina" when the order has no products', async () => {
    // Arrange
    const fixture = await render();

    // Assert
    expect(findButton(fixture, SEND_LABEL).disabled).toBe(true);
  });

  // CA2
  it('should show the table message and not send when neither a table nor take away is chosen', async () => {
    // Arrange
    const requests: CreateOrderRequest[] = [];
    const fixture = await render(requests);
    TestBed.inject(OrderDraftService).add({
      productId: 'burger',
      name: 'Hamburguesa',
      unitPrice: 79,
    });
    await fixture.whenStable();

    // Act
    await click(fixture, SEND_LABEL);

    // Assert
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent?.trim()).toBe(TAKE_ORDER_MESSAGES.destinationRequired);
    expect(requests).toHaveLength(0);
  });

  // CA1
  it('should send the order for the chosen table and open the confirmation', async () => {
    // Arrange
    const requests: CreateOrderRequest[] = [];
    const fixture = await render(requests);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    TestBed.inject(OrderDraftService).add({
      productId: 'burger',
      name: 'Hamburguesa',
      unitPrice: 79,
    });
    await fixture.whenStable();
    await click(fixture, 'Mesa 5');

    // Act
    await click(fixture, SEND_LABEL);

    // Assert
    expect(requests[0]).toMatchObject({ tableId: 'table-5', takeAway: false });
    expect(navigate).toHaveBeenCalledWith('/orders/sent');
  });

  it('should show the total of the order', async () => {
    // Arrange
    const fixture = await render();
    TestBed.inject(OrderDraftService).add(
      { productId: 'burger', name: 'Hamburguesa', unitPrice: 79 },
      2,
    );
    await fixture.whenStable();

    // Assert
    const total = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="order-total"]',
    );
    expect(total?.textContent?.trim()).toBe('$158.00');
  });
});
