import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { type Observable, delay, of, throwError } from 'rxjs';

import type {
  CreatePickupOrderRequest,
  PickupOrder,
  PickupOrderItem,
  PickupOrderStatus,
} from '../models/pickup-order.models';
import { MOCK_MENU } from './mock-pickup.data';
import type { PickupApi } from './pickup-api';

const MOCK_LATENCY_MS = 300;
const FIRST_ORDER_NUMBER = 200;
const MAX_ACTIVE_ORDERS_PER_PHONE = 2;
/** The mock kitchen moves an order one step every few seconds, so the whole flow can be seen. */
const MOCK_STEP_MS = 12_000;
const STATUS_FLOW: readonly PickupOrderStatus[] = ['New', 'InPreparation', 'Ready', 'Delivered'];

interface StoredOrder {
  readonly order: Omit<PickupOrder, 'status'>;
  /** Kept only to apply the limit per phone; it is never returned. */
  readonly phone: string;
}

/**
 * In-memory pickup orders for `useMockApi`. Like the API, a repeated `clientOrderId` returns the order it already
 * has, a phone cannot have more than 2 active orders, and the status advances with time.
 */
@Injectable()
export class MockPickupApiService implements PickupApi {
  private readonly orders = new Map<string, StoredOrder>();
  private nextOrderNumber = FIRST_ORDER_NUMBER;

  createOrder(request: CreatePickupOrderRequest): Observable<PickupOrder> {
    const existing = this.orders.get(request.clientOrderId);
    if (existing) {
      return of(this.view(existing)).pipe(delay(MOCK_LATENCY_MS));
    }

    const active = [...this.orders.values()].filter(
      (stored) => stored.phone === request.phone && this.statusOf(stored) !== 'Delivered',
    );
    if (active.length >= MAX_ACTIVE_ORDERS_PER_PHONE) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              status: 409,
              detail: 'Ya tienes 2 pedidos en curso. Espera a que los entreguemos para pedir otro.',
            },
          }),
      ).pipe(delay(MOCK_LATENCY_MS));
    }

    const items: PickupOrderItem[] = request.items.map((item) => {
      const product = MOCK_MENU.get(item.productId);
      const unitPrice = product?.price ?? 0;
      return {
        name: product?.name ?? 'Producto',
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
      };
    });
    const stored: StoredOrder = {
      phone: request.phone,
      order: {
        clientOrderId: request.clientOrderId,
        orderNumber: this.nextOrderNumber++,
        total: items.reduce((total, item) => total + item.subtotal, 0),
        createdAt: new Date().toISOString(),
        items,
      },
    };
    this.orders.set(request.clientOrderId, stored);
    return of(this.view(stored)).pipe(delay(MOCK_LATENCY_MS));
  }

  getOrder(clientOrderId: string): Observable<PickupOrder> {
    const stored = this.orders.get(clientOrderId);
    if (!stored) {
      return throwError(() => new HttpErrorResponse({ status: 404 })).pipe(delay(MOCK_LATENCY_MS));
    }
    return of(this.view(stored)).pipe(delay(MOCK_LATENCY_MS));
  }

  private statusOf(stored: StoredOrder): PickupOrderStatus {
    const steps = Math.floor((Date.now() - Date.parse(stored.order.createdAt)) / MOCK_STEP_MS);
    return STATUS_FLOW[Math.min(steps, STATUS_FLOW.length - 1)];
  }

  private view(stored: StoredOrder): PickupOrder {
    return { ...stored.order, status: this.statusOf(stored) };
  }
}
