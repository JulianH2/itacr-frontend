import { Injectable } from '@angular/core';
import { type Observable, delay, of } from 'rxjs';

import type {
  KitchenOrderStatus,
  KitchenQueue,
  KitchenStatusChange,
  KitchenStep,
} from '../models/kitchen.models';
import type { KitchenApi } from './kitchen-api';
import { mockKitchenQueue } from './mock-kitchen.data';

const MOCK_LATENCY_MS = 300;

/**
 * In-memory kitchen queue for `useMockApi`. It adds a new order every few polls, and remembers the status changes
 * made on the board (and the one before each, to undo it).
 */
@Injectable()
export class MockKitchenApiService implements KitchenApi {
  private calls = 0;
  private readonly statuses = new Map<string, KitchenOrderStatus>();
  private readonly previous = new Map<string, KitchenOrderStatus>();

  getQueue(): Observable<KitchenQueue> {
    this.calls += 1;
    const queue = mockKitchenQueue(Date.now(), this.calls);
    const orders = queue.orders.map((order) => ({
      ...order,
      status: this.statuses.get(order.id) ?? order.status,
    }));
    return of({ ...queue, orders }).pipe(delay(MOCK_LATENCY_MS));
  }

  changeStatus(orderId: string, status: KitchenStep): Observable<KitchenStatusChange> {
    const current = this.statusOf(orderId);
    this.previous.set(orderId, current);
    return this.answer(orderId, status);
  }

  undoStatusChange(orderId: string): Observable<KitchenStatusChange> {
    const before = this.previous.get(orderId) ?? this.statusOf(orderId);
    this.previous.delete(orderId);
    return this.answer(orderId, before);
  }

  private statusOf(orderId: string): KitchenOrderStatus {
    const fromQueue = mockKitchenQueue(Date.now(), this.calls).orders.find(
      (order) => order.id === orderId,
    );
    return this.statuses.get(orderId) ?? fromQueue?.status ?? 'New';
  }

  private answer(orderId: string, status: KitchenOrderStatus): Observable<KitchenStatusChange> {
    this.statuses.set(orderId, status);
    return of({ id: orderId, status, lastStatusChangeAt: new Date().toISOString() }).pipe(
      delay(MOCK_LATENCY_MS),
    );
  }
}
