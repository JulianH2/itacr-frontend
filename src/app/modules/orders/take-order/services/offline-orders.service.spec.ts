import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, type Observable, of, throwError } from 'rxjs';

import { SESSION_STORAGE, SessionService } from '@shared/auth/session.service';
import { ConnectionStatusService } from '@shared/services/connection-status.service';
import { ToastService } from '@shared/services/toast.service';
import { loginResponse, PAST_EXPIRATION, WAITER } from '@shared/testing/auth-fixtures';
import { MemoryStorage } from '@shared/testing/memory-storage';
import { EmployeeRole } from '@shared/auth/auth.models';

import type {
  CreateOrderRequest,
  DiningTable,
  OrderDetail,
  PendingOrder,
  PlacedOrder,
  RecentOrder,
} from '../models/take-order.models';
import { OfflineOrdersService, type PendingOrderSummary } from './offline-orders.service';
import { ORDERS_API, type OrdersApi } from './orders-api';
import { MemoryPendingOrdersStorage, PENDING_ORDERS_STORAGE } from './pending-orders-storage';

const SUMMARY: PendingOrderSummary = { tableNumber: 5, itemCount: 1, total: 79 };

function request(clientOrderId: string, createdAt: string): CreateOrderRequest {
  return {
    clientOrderId,
    tableId: 'table-5',
    takeAway: false,
    items: [{ productId: 'burger', quantity: 1 }],
    createdAt,
  };
}

class FakeOrdersApi implements OrdersApi {
  readonly requests: CreateOrderRequest[] = [];
  readonly errors: unknown[] = [];

  getDiningTables(): Observable<readonly DiningTable[]> {
    return of([]);
  }

  createOrder(order: CreateOrderRequest): Observable<PlacedOrder> {
    this.requests.push(order);
    const error = this.errors.shift();
    return error === undefined
      ? of({
          id: `id-${order.clientOrderId}`,
          clientOrderId: order.clientOrderId,
          orderNumber: this.requests.length,
          status: 'New',
          channel: 'DineIn',
          tableNumber: 5,
          total: 79,
          createdAt: order.createdAt,
          items: [],
        })
      : throwError(() => error);
  }

  getOrder(): Observable<OrderDetail> {
    return EMPTY;
  }

  getRecentOrders(): Observable<readonly RecentOrder[]> {
    return of([]);
  }
}

describe('OfflineOrdersService', () => {
  let api: FakeOrdersApi;
  let storage: MemoryPendingOrdersStorage;
  let online: ReturnType<typeof signal<boolean>>;

  function setUp(): OfflineOrdersService {
    TestBed.configureTestingModule({
      providers: [
        { provide: ORDERS_API, useValue: api },
        { provide: PENDING_ORDERS_STORAGE, useValue: storage },
        { provide: ConnectionStatusService, useValue: { online } },
        { provide: SESSION_STORAGE, useValue: new MemoryStorage() },
      ],
    });
    TestBed.inject(SessionService).start(loginResponse(EmployeeRole.Waiter));
    return TestBed.inject(OfflineOrdersService);
  }

  beforeEach(() => {
    api = new FakeOrdersApi();
    storage = new MemoryPendingOrdersStorage();
    online = signal(false);
  });

  // CA1
  it('should keep the order on the device and count it while there is no connection', async () => {
    // Arrange
    const service = setUp();

    // Act
    await service.enqueue(request('a', '2026-10-22T18:00:00.000Z'), SUMMARY);
    await service.sync();

    // Assert
    expect(service.pendingCount()).toBe(1);
    expect(api.requests).toHaveLength(0);
    expect(await storage.getAll()).toEqual([
      expect.objectContaining({ clientOrderId: 'a', employeeId: WAITER.id, state: 'pending' }),
    ]);
  });

  // CA2
  it('should send every pending order in its original order when the connection comes back', async () => {
    // Arrange
    const service = setUp();
    await service.enqueue(request('second', '2026-10-22T18:05:00.000Z'), SUMMARY);
    await service.enqueue(request('first', '2026-10-22T18:00:00.000Z'), SUMMARY);
    await service.enqueue(request('third', '2026-10-22T18:10:00.000Z'), SUMMARY);
    const toast = vi.spyOn(TestBed.inject(ToastService), 'show');

    // Act
    online.set(true);
    TestBed.tick();
    await service.sync();

    // Assert
    expect(api.requests.map((sent) => sent.clientOrderId)).toEqual(['first', 'second', 'third']);
    expect(api.requests[0]?.createdAt).toBe('2026-10-22T18:00:00.000Z');
    expect(service.pendingCount()).toBe(0);
    expect(await storage.getAll()).toEqual([]);
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ message: '3 pedidos llegaron a cocina.' }),
    );
  });

  // CA3
  it('should send each order once when the connection drops and comes back several times', async () => {
    // Arrange
    online.set(true);
    const service = setUp();
    await service.enqueue(request('a', '2026-10-22T18:00:00.000Z'), SUMMARY);

    // Act
    await Promise.all([service.sync(), service.sync()]);
    online.set(false);
    TestBed.tick();
    online.set(true);
    TestBed.tick();
    await service.sync();

    // Assert
    expect(api.requests).toHaveLength(1);
    expect(service.orders()).toEqual([]);
  });

  it('should stop and keep the orders when the network fails, and send them on the next try', async () => {
    // Arrange
    online.set(true);
    const service = setUp();
    await service.enqueue(request('a', '2026-10-22T18:00:00.000Z'), SUMMARY);
    await service.enqueue(request('b', '2026-10-22T18:01:00.000Z'), SUMMARY);
    api.errors.push(new HttpErrorResponse({ status: 0 }));

    // Act
    await service.sync();
    const afterFailure = service.pendingCount();
    await service.sync();

    // Assert
    expect(afterFailure).toBe(2);
    expect(api.requests.map((sent) => sent.clientOrderId)).toEqual(['a', 'a', 'b']);
    expect(service.pendingCount()).toBe(0);
  });

  it('should mark an order the API rejects and go on with the next one', async () => {
    // Arrange
    online.set(true);
    const service = setUp();
    await service.enqueue(request('old', '2026-10-22T06:00:00.000Z'), SUMMARY);
    await service.enqueue(request('next', '2026-10-22T18:00:00.000Z'), SUMMARY);
    api.errors.push(
      new HttpErrorResponse({
        status: 400,
        error: { errors: { createdAt: ['El pedido lleva más de 12 horas sin enviarse.'] } },
      }),
    );

    // Act
    await service.sync();

    // Assert
    expect(service.orders()).toEqual([
      expect.objectContaining({
        clientOrderId: 'old',
        state: 'failed',
        error: 'El pedido lleva más de 12 horas sin enviarse.',
      }),
    ]);
    expect(service.pendingCount()).toBe(0);
    expect(api.requests.map((sent) => sent.clientOrderId)).toEqual(['old', 'next']);
  });

  it('should remove a rejected order when the waiter discards it', async () => {
    // Arrange
    const service = setUp();
    await service.enqueue(request('a', '2026-10-22T18:00:00.000Z'), SUMMARY);

    // Act
    await service.discard('a');

    // Assert
    expect(service.orders()).toEqual([]);
    expect(await storage.getAll()).toEqual([]);
  });

  it('should load the orders saved before the app closed and send only those of the signed-in waiter', async () => {
    // Arrange
    const own: PendingOrder = {
      clientOrderId: 'own',
      employeeId: WAITER.id,
      request: request('own', '2026-10-22T18:00:00.000Z'),
      ...SUMMARY,
      state: 'pending',
      error: null,
    };
    await storage.put(own);
    await storage.put({ ...own, clientOrderId: 'other', employeeId: 'waiter-2' });
    online.set(true);
    const service = setUp();

    // Act
    await service.start();

    // Assert
    expect(api.requests.map((sent) => sent.clientOrderId)).toEqual(['own']);
    expect((await storage.getAll()).map((order) => order.clientOrderId)).toEqual(['other']);
  });

  it('should wait for a new sign-in when the session expired', async () => {
    // Arrange
    online.set(true);
    const service = setUp();
    await service.enqueue(request('a', '2026-10-22T18:00:00.000Z'), SUMMARY);
    TestBed.inject(SessionService).start(loginResponse(EmployeeRole.Waiter, PAST_EXPIRATION));

    // Act
    await service.sync();

    // Assert
    expect(api.requests).toHaveLength(0);
    expect(service.pendingCount()).toBe(1);
  });
});
