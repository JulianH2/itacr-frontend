import { InjectionToken } from '@angular/core';

import type { PendingOrder } from '../models/take-order.models';

/** Where the orders that could not reach the API wait. They must survive closing the app or restarting the device. */
export interface PendingOrdersStorage {
  getAll(): Promise<readonly PendingOrder[]>;
  put(order: PendingOrder): Promise<void>;
  delete(clientOrderId: string): Promise<void>;
}

const DATABASE_NAME = 'itacr';
const DATABASE_VERSION = 1;
const STORE_NAME = 'pending-orders';

/** IndexedDB, keyed by `clientOrderId`. */
export class IndexedDbPendingOrdersStorage implements PendingOrdersStorage {
  private database: Promise<IDBDatabase> | null = null;

  constructor(private readonly factory: IDBFactory) {}

  getAll(): Promise<readonly PendingOrder[]> {
    return this.run<PendingOrder[]>('readonly', (store) => store.getAll());
  }

  async put(order: PendingOrder): Promise<void> {
    await this.run('readwrite', (store) => store.put(order));
  }

  async delete(clientOrderId: string): Promise<void> {
    await this.run('readwrite', (store) => store.delete(clientOrderId));
  }

  private open(): Promise<IDBDatabase> {
    this.database ??= new Promise((resolve, reject) => {
      const request = this.factory.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () =>
        request.result.createObjectStore(STORE_NAME, { keyPath: 'clientOrderId' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB could not be opened'));
    });
    return this.database;
  }

  /** Resolves when the transaction commits, so a saved order is on disk before the waiter is told so. */
  private async run<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const request = operation(transaction.objectStore(STORE_NAME));
      const fail = (): void =>
        reject(transaction.error ?? new Error('IndexedDB transaction failed'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = fail;
      transaction.onabort = fail;
    });
  }
}

/** For browsers without IndexedDB and for tests. Orders are lost when the app closes. */
export class MemoryPendingOrdersStorage implements PendingOrdersStorage {
  private readonly orders = new Map<string, PendingOrder>();

  getAll(): Promise<readonly PendingOrder[]> {
    return Promise.resolve([...this.orders.values()]);
  }

  put(order: PendingOrder): Promise<void> {
    this.orders.set(order.clientOrderId, order);
    return Promise.resolve();
  }

  delete(clientOrderId: string): Promise<void> {
    this.orders.delete(clientOrderId);
    return Promise.resolve();
  }
}

export const PENDING_ORDERS_STORAGE = new InjectionToken<PendingOrdersStorage>(
  'PENDING_ORDERS_STORAGE',
  {
    providedIn: 'root',
    factory: () =>
      typeof indexedDB === 'undefined'
        ? new MemoryPendingOrdersStorage()
        : new IndexedDbPendingOrdersStorage(indexedDB),
  },
);
