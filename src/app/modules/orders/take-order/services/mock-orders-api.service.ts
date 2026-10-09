import { Injectable } from '@angular/core';
import { type Observable, delay, of } from 'rxjs';

import type {
  CreateOrderRequest,
  DiningTable,
  PlacedOrder,
  PlacedOrderItem,
} from '../models/take-order.models';
import type { OrdersApi } from './orders-api';

const MOCK_LATENCY_MS = 300;
const TABLE_COUNT = 10;
const FIRST_ORDER_NUMBER = 1;
const MOCK_UNIT_PRICE = 0;

/** The tables seeded by itacr-backend (`V001__initial_schema.sql`), with the same ids. */
const MOCK_TABLES: readonly DiningTable[] = Array.from({ length: TABLE_COUNT }, (_, index) => ({
  id: `40000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
  number: index + 1,
}));

/**
 * In-memory orders for `useMockApi`. Like the API, a repeated `clientOrderId` returns the order it already has.
 * It does not know the menu, so item names and prices are placeholders.
 */
@Injectable()
export class MockOrdersApiService implements OrdersApi {
  private readonly orders = new Map<string, PlacedOrder>();
  private nextOrderNumber = FIRST_ORDER_NUMBER;

  getDiningTables(): Observable<readonly DiningTable[]> {
    return of(MOCK_TABLES).pipe(delay(MOCK_LATENCY_MS));
  }

  createOrder(request: CreateOrderRequest): Observable<PlacedOrder> {
    const existing = this.orders.get(request.clientOrderId);
    if (existing) {
      return of(existing).pipe(delay(MOCK_LATENCY_MS));
    }

    const items: PlacedOrderItem[] = request.items.map((item) => ({
      productId: item.productId,
      name: item.productId,
      quantity: item.quantity,
      unitPrice: MOCK_UNIT_PRICE,
      subtotal: MOCK_UNIT_PRICE,
    }));
    const order: PlacedOrder = {
      id: crypto.randomUUID(),
      clientOrderId: request.clientOrderId,
      orderNumber: this.nextOrderNumber++,
      status: 'New',
      channel: request.takeAway ? 'TakeAway' : 'DineIn',
      tableNumber: MOCK_TABLES.find((table) => table.id === request.tableId)?.number ?? null,
      total: MOCK_UNIT_PRICE,
      createdAt: new Date().toISOString(),
      items,
    };
    this.orders.set(request.clientOrderId, order);
    return of(order).pipe(delay(MOCK_LATENCY_MS));
  }
}
