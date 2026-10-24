import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, type Observable, of, throwError } from 'rxjs';

import { ConnectionStatusService } from '@shared/services/connection-status.service';
import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import type {
  CreateOrderRequest,
  DiningTable,
  OrderDetail,
  PlacedOrder,
  QueuedOrderRequest,
  RecentOrder,
} from '../models/take-order.models';
import { TAKE_ORDER_MESSAGES } from '../take-order.messages';
import { OfflineOrdersService, type PendingOrderSummary } from './offline-orders.service';
import { ORDERS_API, type OrdersApi } from './orders-api';
import { TakeOrderStore } from './take-order-store.service';

const TABLE_FIVE: DiningTable = { id: 'table-5', number: 5 };
const BURGER = { productId: 'burger', name: 'Hamburguesa Clásica', unitPrice: 79 };

function placedOrder(request: CreateOrderRequest): PlacedOrder {
  return {
    id: 'order-1',
    clientOrderId: request.clientOrderId,
    orderNumber: 12,
    status: 'New',
    channel: request.takeAway ? 'TakeAway' : 'DineIn',
    tableNumber: request.tableId === TABLE_FIVE.id ? TABLE_FIVE.number : null,
    total: 158,
    createdAt: '2026-10-09T12:00:00Z',
    items: [],
  };
}

class FakeOrdersApi implements OrdersApi {
  readonly requests: CreateOrderRequest[] = [];
  nextError: unknown = null;

  getDiningTables(): Observable<readonly DiningTable[]> {
    return of([TABLE_FIVE]);
  }

  createOrder(request: CreateOrderRequest): Observable<PlacedOrder> {
    this.requests.push(request);
    const error = this.nextError;
    this.nextError = null;
    return error === null ? of(placedOrder(request)) : throwError(() => error);
  }

  getOrder(): Observable<OrderDetail> {
    return EMPTY;
  }

  getRecentOrders(): Observable<readonly RecentOrder[]> {
    return of([]);
  }
}

class FakeOfflineOrders {
  readonly queued: { request: QueuedOrderRequest; summary: PendingOrderSummary }[] = [];
  failToSave = false;

  enqueue(request: QueuedOrderRequest, summary: PendingOrderSummary): Promise<void> {
    if (this.failToSave) {
      return Promise.reject(new Error('QuotaExceededError'));
    }
    this.queued.push({ request, summary });
    return Promise.resolve();
  }
}

describe('TakeOrderStore', () => {
  let api: FakeOrdersApi;
  let offline: FakeOfflineOrders;
  let online: ReturnType<typeof signal<boolean>>;
  let store: TakeOrderStore;
  let draft: OrderDraftService;

  beforeEach(() => {
    api = new FakeOrdersApi();
    offline = new FakeOfflineOrders();
    online = signal(true);
    TestBed.configureTestingModule({
      providers: [
        TakeOrderStore,
        { provide: ORDERS_API, useValue: api },
        { provide: OfflineOrdersService, useValue: offline },
        { provide: ConnectionStatusService, useValue: { online } },
      ],
    });
    store = TestBed.inject(TakeOrderStore);
    draft = TestBed.inject(OrderDraftService);
  });

  // CA3
  it('should not allow sending when the order has no products', async () => {
    // Arrange
    store.selectTable(TABLE_FIVE.id);

    // Act
    const sent = await store.send();

    // Assert
    expect(store.canSend()).toBe(false);
    expect(sent).toBe(false);
    expect(api.requests).toHaveLength(0);
  });

  // CA2
  it('should ask for a table or take away and not send when neither is chosen', async () => {
    // Arrange
    draft.add(BURGER);

    // Act
    const sent = await store.send();

    // Assert
    expect(sent).toBe(false);
    expect(store.error()).toBe(TAKE_ORDER_MESSAGES.destinationRequired);
    expect(api.requests).toHaveLength(0);
    expect(draft.itemCount()).toBe(1);
  });

  // CA1
  it('should send the products with the table and keep the confirmation when the API saves it', async () => {
    // Arrange
    draft.add(BURGER, 2);
    store.selectTable(TABLE_FIVE.id);

    // Act
    const sent = await store.send();

    // Assert
    expect(sent).toBe(true);
    expect(api.requests).toEqual([
      {
        clientOrderId: expect.any(String),
        tableId: TABLE_FIVE.id,
        takeAway: false,
        items: [{ productId: 'burger', quantity: 2 }],
      },
    ]);
    expect(store.sentOrder()?.tableNumber).toBe(5);
    expect(store.sentOrder()?.status).toBe('New');
    expect(draft.itemCount()).toBe(0);
    expect(store.tableId()).toBeNull();
  });

  it('should send without a table when the order is to take away', async () => {
    // Arrange
    draft.add(BURGER);
    store.selectTable(TABLE_FIVE.id);

    // Act
    store.setTakeAway(true);
    await store.send();

    // Assert
    expect(api.requests[0]).toMatchObject({ tableId: null, takeAway: true });
  });

  it('should reuse the same clientOrderId when the same order is sent again after a failure', async () => {
    // Arrange
    draft.add(BURGER);
    store.selectTable(TABLE_FIVE.id);
    api.nextError = new HttpErrorResponse({ status: 500 });
    await store.send();

    // Act
    const sent = await store.send();

    // Assert
    expect(sent).toBe(true);
    expect(api.requests).toHaveLength(2);
    expect(api.requests[1]?.clientOrderId).toBe(api.requests[0]?.clientOrderId);
  });

  it('should use a new clientOrderId when the order changed after a failure', async () => {
    // Arrange
    draft.add(BURGER);
    store.selectTable(TABLE_FIVE.id);
    api.nextError = new HttpErrorResponse({ status: 500 });
    await store.send();

    // Act
    draft.add(BURGER);
    await store.send();

    // Assert
    expect(api.requests[1]?.clientOrderId).not.toBe(api.requests[0]?.clientOrderId);
  });

  // HU_07 CA1
  it('should save the order on the device without calling the API when there is no connection', async () => {
    // Arrange
    store.tables();
    TestBed.tick();
    draft.add(BURGER, 2);
    store.selectTable(TABLE_FIVE.id);
    online.set(false);

    // Act
    const sent = await store.send();

    // Assert
    expect(sent).toBe(true);
    expect(api.requests).toHaveLength(0);
    expect(offline.queued).toHaveLength(1);
    expect(offline.queued[0]?.request).toMatchObject({ tableId: TABLE_FIVE.id, takeAway: false });
    expect(Date.parse(offline.queued[0]?.request.createdAt ?? '')).not.toBeNaN();
    expect(store.queuedOrder()).toEqual({ tableNumber: 5, itemCount: 2, total: 158 });
    expect(store.sentOrder()).toBeNull();
    expect(draft.itemCount()).toBe(0);
  });

  // A device clock ahead of the server must not block online orders: the server uses its own time.
  it('should leave the device time out of an order sent with a connection', async () => {
    // Arrange
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'));
    draft.add(BURGER);
    store.setTakeAway(true);

    // Act
    await store.send();
    vi.useRealTimers();

    // Assert
    expect(api.requests[0]).not.toHaveProperty('createdAt');
  });

  // A Wi-Fi without internet reports online; the request fails and the order is saved the same way.
  it('should save the order with the same clientOrderId when the network fails while sending', async () => {
    // Arrange
    draft.add(BURGER);
    store.setTakeAway(true);
    api.nextError = new HttpErrorResponse({ status: 0 });

    // Act
    const sent = await store.send();

    // Assert
    expect(sent).toBe(true);
    expect(offline.queued[0]?.request.clientOrderId).toBe(api.requests[0]?.clientOrderId);
    expect(api.requests[0]).not.toHaveProperty('createdAt');
    expect(Date.parse(offline.queued[0]?.request.createdAt ?? '')).not.toBeNaN();
    expect(store.queuedOrder()).toEqual({ tableNumber: null, itemCount: 1, total: 79 });
    expect(store.error()).toBeNull();
  });

  it('should keep the order and say so when the device cannot save it', async () => {
    // Arrange
    draft.add(BURGER);
    store.setTakeAway(true);
    online.set(false);
    offline.failToSave = true;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    // Act
    const sent = await store.send();

    // Assert
    expect(sent).toBe(false);
    expect(store.error()).toBe(TAKE_ORDER_MESSAGES.notSaved);
    expect(store.queuedOrder()).toBeNull();
    expect(draft.itemCount()).toBe(1);
  });

  it('should show the first validation message of the API when it rejects the order', async () => {
    // Arrange
    draft.add(BURGER);
    store.selectTable(TABLE_FIVE.id);
    api.nextError = new HttpErrorResponse({
      status: 400,
      error: { errors: { items: ['Uno o más productos ya no están en el menú.'] } },
    });

    // Act
    await store.send();

    // Assert
    expect(store.error()).toBe('Uno o más productos ya no están en el menú.');
  });

  // CA4
  it('should empty the order and forget the confirmation when a new order starts', async () => {
    // Arrange
    draft.add(BURGER);
    store.selectTable(TABLE_FIVE.id);
    await store.send();
    draft.add(BURGER);

    // Act
    store.startNewOrder();

    // Assert
    expect(store.sentOrder()).toBeNull();
    expect(draft.itemCount()).toBe(0);
    expect(store.tableId()).toBeNull();
    expect(store.takeAway()).toBe(false);
  });
});
