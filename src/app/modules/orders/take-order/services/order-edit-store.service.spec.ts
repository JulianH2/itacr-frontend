import { HttpErrorResponse } from '@angular/common/http';
import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, type Observable, of, throwError } from 'rxjs';

import { ConnectionStatusService } from '@shared/services/connection-status.service';
import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import type {
  ActiveOrder,
  DeliveredOrder,
  DiningTable,
  OrderDetail,
  PlacedOrder,
  UpdateOrderRequest,
} from '../models/take-order.models';
import { TAKE_ORDER_MESSAGES } from '../take-order.messages';
import { OrderEditStore } from './order-edit-store.service';
import { ORDERS_API, type OrdersApi } from './orders-api';
import { TakeOrderStore } from './take-order-store.service';

const TABLE_FIVE: DiningTable = { id: 'table-5', number: 5 };
const TABLE_TWO: DiningTable = { id: 'table-2', number: 2 };

const DETAIL: OrderDetail = {
  id: 'order-1',
  orderNumber: 12,
  channel: 'DineIn',
  status: 'New',
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

const COMBO_DETAIL: OrderDetail = {
  ...DETAIL,
  items: [
    {
      productId: 'combo',
      name: 'Combo Clásico',
      quantity: 2,
      unitPrice: 156,
      subtotal: 312,
      size: 'Grande',
      drink: 'Refresco de cola',
      extras: ['Queso extra'],
      exclusions: ['Cebolla'],
      sizeId: 'size-large',
      drinkId: 'drink-cola',
      extraIds: ['extra-cheese'],
      exclusionIds: ['no-onion'],
    },
  ],
};

class FakeOrdersApi implements OrdersApi {
  readonly updates: { orderId: string; request: UpdateOrderRequest }[] = [];
  order: OrderDetail = DETAIL;
  orderError: unknown = null;
  updateError: unknown = null;

  getDiningTables(): Observable<readonly DiningTable[]> {
    return of([TABLE_FIVE, TABLE_TWO]);
  }

  createOrder(): Observable<PlacedOrder> {
    return EMPTY;
  }

  getOrder(): Observable<OrderDetail> {
    return this.orderError === null ? of(this.order) : throwError(() => this.orderError);
  }

  updateOrder(orderId: string, request: UpdateOrderRequest): Observable<OrderDetail> {
    this.updates.push({ orderId, request });
    return this.updateError === null
      ? of({ ...DETAIL, modifiedAt: '2026-11-12T18:05:00Z', total: 195 })
      : throwError(() => this.updateError);
  }

  getActiveOrders(): Observable<readonly ActiveOrder[]> {
    return of([]);
  }

  deliverOrder(): Observable<DeliveredOrder> {
    return EMPTY;
  }

  getReadyPickupOrders(): Observable<readonly ActiveOrder[]> {
    return of([]);
  }
}

describe('OrderEditStore', () => {
  let api: FakeOrdersApi;
  let online: ReturnType<typeof signal<boolean>>;
  let draft: OrderDraftService;
  let store: OrderEditStore;

  beforeEach(async () => {
    api = new FakeOrdersApi();
    online = signal(true);
    TestBed.configureTestingModule({
      providers: [
        TakeOrderStore,
        OrderEditStore,
        { provide: ORDERS_API, useValue: api },
        { provide: ConnectionStatusService, useValue: { online } },
      ],
    });
    draft = TestBed.inject(OrderDraftService);
    store = TestBed.inject(OrderEditStore);
    await TestBed.inject(ApplicationRef).whenStable();
  });

  it('should put the lines of the order in the draft, and keep the new order the waiter was building', async () => {
    // Arrange
    draft.add({ productId: 'fries', name: 'Papas', unitPrice: 35 });

    // Act
    await store.open('order-1');

    // Assert
    expect(draft.editingOrderId()).toBe('order-1');
    expect(store.items().map((item) => [item.productId, item.quantity, item.unitPrice])).toEqual([
      ['burger', 1, 79],
      ['soda', 1, 29],
    ]);
    expect(store.total()).toBe(108);
    store.cancel();
    expect(draft.items().map((item) => item.productId)).toEqual(['fries']);
    expect(draft.editingOrderId()).toBeNull();
  });

  it('should rebuild the options of a combo from the ids of the detail', async () => {
    // Arrange
    api.order = COMBO_DETAIL;

    // Act
    await store.open('order-1');
    await store.save();

    // Assert
    expect(api.updates[0].request.items).toEqual([
      {
        productId: 'combo',
        quantity: 2,
        sizeId: 'size-large',
        drinkId: 'drink-cola',
        extraIds: ['extra-cheese'],
        exclusionIds: ['no-onion'],
      },
    ]);
  });

  it('should not offer the edit when an option of a combo is no longer on the menu', async () => {
    // Arrange
    api.order = {
      ...COMBO_DETAIL,
      items: [{ ...COMBO_DETAIL.items[0], extraIds: [null] }],
    };

    // Act
    await store.open('order-1');

    // Assert
    expect(store.order()).toBeNull();
    expect(store.problem()).toBe('failed');
    expect(draft.editingOrderId()).toBeNull();
  });

  it.each([
    ['Ready', 'DineIn'],
    ['Delivered', 'DineIn'],
    ['New', 'MobileApp'],
  ] as const)(
    'should not open an order that is %s on channel %s (CA2)',
    async (status, channel) => {
      // Arrange
      api.order = { ...DETAIL, status, channel };

      // Act
      await store.open('order-1');

      // Assert
      expect(store.problem()).toBe('unavailable');
      expect(store.order()).toBeNull();
      expect(draft.editingOrderId()).toBeNull();
    },
  );

  it('should tell that the order does not exist when the API answers 404', async () => {
    // Arrange
    api.orderError = new HttpErrorResponse({ status: 404 });

    // Act
    await store.open('order-1');

    // Assert
    expect(store.problem()).toBe('not-found');
  });

  it('should send the whole new content with the added product and show the new total (CA1)', async () => {
    // Arrange
    await store.open('order-1');
    draft.add({ productId: 'nuggets', name: 'Nuggets', unitPrice: 55 });
    draft.changeQuantity('soda', 2);
    store.selectTable(TABLE_TWO.id);
    store.setNote('  Sin sal ');

    // Act
    const result = await store.save();

    // Assert
    expect(result).toEqual({ saved: expect.objectContaining({ total: 195 }) });
    expect(api.updates).toEqual([
      {
        orderId: 'order-1',
        request: {
          tableId: 'table-2',
          items: [
            { productId: 'burger', quantity: 1 },
            { productId: 'soda', quantity: 2 },
            { productId: 'nuggets', quantity: 1 },
          ],
          note: 'Sin sal',
        },
      },
    ]);
    expect(draft.editingOrderId()).toBeNull();
  });

  it('should keep the table of the order and leave out the note when the waiter changed neither', async () => {
    // Arrange
    await store.open('order-1');

    // Act
    await store.save();

    // Assert
    expect(api.updates[0].request.tableId).toBe('table-5');
    expect(api.updates[0].request).not.toHaveProperty('note');
  });

  it('should send no table for a take-away order', async () => {
    // Arrange
    api.order = { ...DETAIL, channel: 'TakeAway', tableNumber: null };
    await store.open('order-1');

    // Act
    await store.save();

    // Assert
    expect(store.hasTable()).toBe(false);
    expect(api.updates[0].request.tableId).toBeNull();
  });

  it('should send nothing and leave the order as it was when the waiter cancels (CA3)', async () => {
    // Arrange
    await store.open('order-1');
    draft.add({ productId: 'nuggets', name: 'Nuggets', unitPrice: 55 });
    store.setNote('Algo');

    // Act
    store.cancel();

    // Assert
    expect(api.updates).toEqual([]);
    expect(draft.items()).toEqual([]);
    expect(store.order()).toBeNull();
    expect(store.note()).toBe('');
  });

  it('should not let the waiter leave the order without products', async () => {
    // Arrange
    await store.open('order-1');

    // Act
    draft.remove('burger');
    draft.remove('soda');
    const result = await store.save();

    // Assert
    expect(store.canSave()).toBe(false);
    expect(store.notice()).toBe(TAKE_ORDER_MESSAGES.editEmpty);
    expect(result).toBeNull();
    expect(api.updates).toEqual([]);
  });

  it('should ask for a table when the order is dine-in and none is picked', async () => {
    // Arrange
    api.order = { ...DETAIL, tableNumber: 99 };

    // Act
    await store.open('order-1');

    // Assert
    expect(store.tableId()).toBeNull();
    expect(store.notice()).toBe(TAKE_ORDER_MESSAGES.editTableRequired);
    store.selectTable(TABLE_TWO.id);
    expect(store.notice()).toBeNull();
  });

  it('should explain that a connection is needed, and send nothing, when there is none', async () => {
    // Arrange
    await store.open('order-1');
    online.set(false);

    // Act
    const result = await store.save();

    // Assert
    expect(result).toBeNull();
    expect(store.canSave()).toBe(false);
    expect(store.error()).toBe(TAKE_ORDER_MESSAGES.editOffline);
    expect(api.updates).toEqual([]);
    expect(draft.editingOrderId()).toBe('order-1');
  });

  it('should drop the changes and ask to read the order again when the API answers 409', async () => {
    // Arrange
    await store.open('order-1');
    api.updateError = new HttpErrorResponse({
      status: 409,
      error: { detail: 'El pedido ya no se puede modificar porque cocina lo marcó como listo.' },
    });

    // Act
    const result = await store.save();

    // Assert
    expect(result).toEqual({ reload: true });
    expect(store.error()).toBe(
      'El pedido ya no se puede modificar porque cocina lo marcó como listo.',
    );
    expect(draft.editingOrderId()).toBeNull();
  });

  it('should keep the changes so the waiter can try again when there is no connection', async () => {
    // Arrange
    await store.open('order-1');
    draft.add({ productId: 'nuggets', name: 'Nuggets', unitPrice: 55 });
    api.updateError = new HttpErrorResponse({ status: 0 });

    // Act
    const result = await store.save();

    // Assert
    expect(result).toBeNull();
    expect(store.error()).toBe(TAKE_ORDER_MESSAGES.editNetwork);
    expect(draft.editingOrderId()).toBe('order-1');
    expect(store.items()).toHaveLength(3);
    expect(store.canSave()).toBe(true);
  });

  it('should keep the changes made so far when the waiter comes back from the catalog', async () => {
    // Arrange
    await store.open('order-1');
    draft.add({ productId: 'nuggets', name: 'Nuggets', unitPrice: 55 });

    // Act
    await store.open('order-1');

    // Assert
    expect(store.items()).toHaveLength(3);
  });
});
