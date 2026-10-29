import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { type Observable, delay, of, throwError } from 'rxjs';

import type {
  CreateOrderRequest,
  DeliveredOrder,
  DiningTable,
  OrderDetail,
  PlacedOrder,
  PlacedOrderItem,
  ActiveOrder,
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
      createdAt: request.createdAt ?? new Date().toISOString(),
      items,
    };
    this.orders.set(request.clientOrderId, order);
    return of(order).pipe(delay(MOCK_LATENCY_MS));
  }

  /** The mock kitchen is another service, so mock orders stay in New. */
  getOrder(orderId: string): Observable<OrderDetail> {
    const order = [...this.orders.values()].find((candidate) => candidate.id === orderId);
    if (!order) {
      return throwError(() => new HttpErrorResponse({ status: 404 }));
    }

    const detail: OrderDetail = {
      id: order.id,
      orderNumber: order.orderNumber,
      channel: order.channel,
      status: order.status,
      tableNumber: order.tableNumber,
      total: order.total,
      createdAt: order.createdAt,
      readyAt: null,
      deliveredAt: null,
      items: order.items,
      timeline: [{ status: 'New', changedAt: order.createdAt, undone: false }],
    };
    return of(detail).pipe(delay(MOCK_LATENCY_MS));
  }

  /** The mock kitchen never marks an order Ready, so the mock never has one to deliver. */
  deliverOrder(orderId: string): Observable<DeliveredOrder> {
    const order = [...this.orders.values()].find((candidate) => candidate.id === orderId);
    if (!order) {
      return throwError(() => new HttpErrorResponse({ status: 404 }));
    }
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 409,
          error: {
            detail:
              'El pedido todavía no está listo. Solo se puede entregar cuando cocina lo marca como listo.',
          },
        }),
    );
  }

  getReadyPickupOrders(): Observable<readonly ActiveOrder[]> {
    return of([]).pipe(delay(MOCK_LATENCY_MS));
  }

  getActiveOrders(): Observable<readonly ActiveOrder[]> {
    const active = [...this.orders.values()]
      .filter((order) => order.status !== 'Delivered')
      .reverse()
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        channel: order.channel,
        status: order.status,
        tableNumber: order.tableNumber,
        createdAt: order.createdAt,
        lastStatusChangeAt: order.createdAt,
      }));
    return of(active).pipe(delay(MOCK_LATENCY_MS));
  }
}
