import { TestBed } from '@angular/core/testing';

import type { PendingOrder } from '../models/take-order.models';
import { MemoryPendingOrdersStorage, PENDING_ORDERS_STORAGE } from './pending-orders-storage';

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
