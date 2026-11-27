import { TestBed } from '@angular/core/testing';
import { IDBFactory as FakeIdbFactory } from 'fake-indexeddb';

import type { PendingOrder } from '../models/take-order.models';
import {
  IndexedDbPendingOrdersStorage,
  MemoryPendingOrdersStorage,
  PENDING_ORDERS_STORAGE,
} from './pending-orders-storage';

function pendingOrder(clientOrderId: string): PendingOrder {
  return {
    clientOrderId,
    employeeId: 'waiter-1',
    request: {
      clientOrderId,
      tableId: null,
      takeAway: true,
      items: [{ productId: 'product-1', quantity: 1 }],
      createdAt: '2026-10-01T12:00:00.000Z',
    },
    tableNumber: null,
    itemCount: 1,
    total: 55,
    state: 'pending',
    error: null,
  };
}

describe('MemoryPendingOrdersStorage', () => {
  let storage: MemoryPendingOrdersStorage;

  beforeEach(() => {
    storage = new MemoryPendingOrdersStorage();
  });

  it('should start with no orders', async () => {
    // Act / Assert
    await expect(storage.getAll()).resolves.toEqual([]);
  });

  it('should save an order and give it back', async () => {
    // Arrange
    const order = pendingOrder('order-1');

    // Act
    await storage.put(order);

    // Assert
    await expect(storage.getAll()).resolves.toEqual([order]);
  });

  it('should replace the order of a retry instead of saving a second one', async () => {
    // Arrange
    await storage.put(pendingOrder('order-1'));
    const retried = { ...pendingOrder('order-1'), state: 'failed' as const, error: 'Sin conexión' };

    // Act
    await storage.put(retried);

    // Assert
    await expect(storage.getAll()).resolves.toEqual([retried]);
  });

  it('should delete only the order of the client that was sent', async () => {
    // Arrange
    await storage.put(pendingOrder('order-1'));
    await storage.put(pendingOrder('order-2'));

    // Act
    await storage.delete('order-1');

    // Assert
    const orders = await storage.getAll();
    expect(orders.map((order) => order.clientOrderId)).toEqual(['order-2']);
  });

  it('should do nothing when the order to delete is not there', async () => {
    // Arrange
    await storage.put(pendingOrder('order-1'));

    // Act
    await storage.delete('order-9');

    // Assert
    await expect(storage.getAll()).resolves.toHaveLength(1);
  });
});

describe('PENDING_ORDERS_STORAGE', () => {
  it('should give a storage that keeps the orders of the device', async () => {
    // Arrange
    TestBed.configureTestingModule({});

    // Act
    const storage = TestBed.inject(PENDING_ORDERS_STORAGE);
    await storage.put(pendingOrder('order-1'));

    // Assert
    await expect(storage.getAll()).resolves.toHaveLength(1);
  });
});

describe('IndexedDbPendingOrdersStorage', () => {
  let storage: IndexedDbPendingOrdersStorage;

  beforeEach(() => {
    storage = new IndexedDbPendingOrdersStorage(new FakeIdbFactory());
  });

  it('should keep the orders, replace a retry and delete a sent one', async () => {
    // Arrange
    await storage.put(pendingOrder('order-1'));
    await storage.put(pendingOrder('order-2'));
    await storage.put({ ...pendingOrder('order-1'), state: 'failed', error: 'Sin conexión' });

    // Act
    await storage.delete('order-2');

    // Assert
    const orders = await storage.getAll();
    expect(orders).toEqual([
      { ...pendingOrder('order-1'), state: 'failed', error: 'Sin conexión' },
    ]);
  });

  it('should fail when the database cannot be opened', async () => {
    // Arrange
    const request = {} as IDBOpenDBRequest & { error: DOMException | null };
    const factory = { open: () => request } as unknown as IDBFactory;
    const broken = new IndexedDbPendingOrdersStorage(factory);

    // Act
    const reading = broken.getAll();
    Object.assign(request, { error: null });
    request.onerror?.(new Event('error'));

    // Assert
    await expect(reading).rejects.toThrow('IndexedDB could not be opened');
  });

  it('should give the error of the browser when the database cannot be opened', async () => {
    // Arrange
    const request = {} as IDBOpenDBRequest;
    const factory = { open: () => request } as unknown as IDBFactory;
    const broken = new IndexedDbPendingOrdersStorage(factory);
    const failure = new DOMException('quota', 'QuotaExceededError');

    // Act
    const reading = broken.getAll();
    Object.assign(request, { error: failure });
    request.onerror?.(new Event('error'));

    // Assert
    await expect(reading).rejects.toBe(failure);
  });

  it.each([
    ['with the error of the browser', new DOMException('aborted', 'AbortError'), 'aborted'],
    ['with its own error when the browser gives none', null, 'IndexedDB transaction failed'],
  ])('should fail a transaction that does not commit %s', async (_case, error, message) => {
    // Arrange
    const transaction = {
      error,
      objectStore: () => ({ put: () => ({}) }),
    } as unknown as IDBTransaction;
    const database = { transaction: () => transaction } as unknown as IDBDatabase;
    const request = { result: database } as unknown as IDBOpenDBRequest;
    const factory = { open: () => request } as unknown as IDBFactory;
    const broken = new IndexedDbPendingOrdersStorage(factory);

    // Act
    const saving = broken.put(pendingOrder('order-1'));
    request.onsuccess?.(new Event('success'));
    await Promise.resolve();
    await Promise.resolve();
    transaction.onabort?.(new Event('abort'));

    // Assert
    await expect(saving).rejects.toThrow(message);
  });
});

describe('PENDING_ORDERS_STORAGE without IndexedDB', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should keep the orders in memory when the browser has no IndexedDB', () => {
    // Arrange
    vi.stubGlobal('indexedDB', undefined);
    TestBed.configureTestingModule({});

    // Act / Assert
    expect(TestBed.inject(PENDING_ORDERS_STORAGE)).toBeInstanceOf(MemoryPendingOrdersStorage);
  });

  it('should use IndexedDB when the browser has it', () => {
    // Arrange
    vi.stubGlobal('indexedDB', new FakeIdbFactory());
    TestBed.configureTestingModule({});

    // Act / Assert
    expect(TestBed.inject(PENDING_ORDERS_STORAGE)).toBeInstanceOf(IndexedDbPendingOrdersStorage);
  });
});
