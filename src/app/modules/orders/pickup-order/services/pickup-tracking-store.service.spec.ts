import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { type Observable, of, throwError } from 'rxjs';

import {
  PICKUP_RECEIPTS_STORAGE,
  PickupReceiptsService,
} from '@shared/state/pickup-receipts/pickup-receipts.service';
import { MemoryStorage } from '@shared/testing/memory-storage';

import type { PickupOrder, PickupOrderStatus } from '../models/pickup-order.models';
import { PICKUP_API } from './pickup-api';
import { PickupTrackingStore, TRACKING_INTERVAL_MS } from './pickup-tracking-store.service';

function order(id: string, number: number, status: PickupOrderStatus, minute: number): PickupOrder {
  return {
    clientOrderId: id,
    orderNumber: number,
    status,
    total: 100,
    createdAt: new Date(Date.UTC(2026, 9, 15, 18, minute)).toISOString(),
    items: [],
  };
}

describe('PickupTrackingStore', () => {
  let answers: Record<string, () => Observable<PickupOrder>>;
  let asked: string[];
  let receipts: PickupReceiptsService;

  function createStore(): PickupTrackingStore {
    TestBed.configureTestingModule({
      providers: [
        PickupTrackingStore,
        { provide: PICKUP_RECEIPTS_STORAGE, useValue: new MemoryStorage() },
        {
          provide: PICKUP_API,
          useValue: {
            createOrder: () => throwError(() => new Error('not used')),
            getOrder: (id: string) => {
              asked.push(id);
              return answers[id]();
            },
          },
        },
      ],
    });
    receipts = TestBed.inject(PickupReceiptsService);
    receipts.add({ clientOrderId: 'a', orderNumber: 1 });
    receipts.add({ clientOrderId: 'b', orderNumber: 2 });
    const store = TestBed.inject(PickupTrackingStore);
    return store;
  }

  /** Lets the polling run (the first poll is scheduled with timer(0)) and its promises settle. */
  async function tick(ms: number): Promise<void> {
    await vi.advanceTimersByTimeAsync(ms);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    asked = [];
    answers = {
      a: () => of(order('a', 1, 'New', 0)),
      b: () => of(order('b', 2, 'InPreparation', 5)),
    };
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // CA3
  it('should ask for the status of every receipt at once and show the newest order first', async () => {
    // Arrange
    const store = createStore();

    // Act
    await tick(0);

    // Assert
    expect(asked).toEqual(['a', 'b']);
    expect(store.orders().map((item) => item.clientOrderId)).toEqual(['b', 'a']);
    expect(store.isLoading()).toBe(false);
  });

  it('should ask again every interval, so the status follows the kitchen', async () => {
    // Arrange
    const store = createStore();
    await tick(0);

    // Act
    answers['a'] = () => of(order('a', 1, 'Ready', 0));
    await tick(TRACKING_INTERVAL_MS);

    // Assert
    expect(store.orders().find((item) => item.clientOrderId === 'a')?.status).toBe('Ready');
    expect(asked.filter((id) => id === 'a')).toHaveLength(2);
  });

  it('should keep a delivered order on screen, drop its receipt, and stop asking for it', async () => {
    // Arrange
    const store = createStore();
    await tick(0);

    // Act
    answers['a'] = () => of(order('a', 1, 'Delivered', 0));
    await tick(TRACKING_INTERVAL_MS);
    asked = [];
    await tick(TRACKING_INTERVAL_MS);

    // Assert
    expect(store.orders().map((item) => item.status)).toContain('Delivered');
    expect(receipts.receipts().map((receipt) => receipt.clientOrderId)).toEqual(['b']);
    expect(asked).toEqual(['b']);
  });

  it('should forget an order the server does not know', async () => {
    // Arrange
    answers['a'] = () => throwError(() => new HttpErrorResponse({ status: 404 }));
    const store = createStore();

    // Act
    await tick(0);

    // Assert
    expect(store.orders().map((item) => item.clientOrderId)).toEqual(['b']);
    expect(receipts.receipts().map((receipt) => receipt.clientOrderId)).toEqual(['b']);
  });

  it('should keep what it has and flag the screen as outdated when a poll fails', async () => {
    // Arrange
    const store = createStore();
    await tick(0);

    // Act
    answers['a'] = () => throwError(() => new HttpErrorResponse({ status: 0 }));
    await tick(TRACKING_INTERVAL_MS);

    // Assert
    expect(store.isOutdated()).toBe(true);
    expect(store.orders()).toHaveLength(2);
  });

  it('should not ask while the page is hidden', async () => {
    // Arrange
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    createStore();

    // Act
    await tick(TRACKING_INTERVAL_MS * 2);

    // Assert
    expect(asked).toEqual([]);
  });

  it('should report an empty screen when the device has no receipts', async () => {
    // Arrange
    TestBed.configureTestingModule({
      providers: [
        PickupTrackingStore,
        { provide: PICKUP_RECEIPTS_STORAGE, useValue: new MemoryStorage() },
        { provide: PICKUP_API, useValue: { getOrder: () => of(order('x', 9, 'New', 0)) } },
      ],
    });

    // Act
    const store = TestBed.inject(PickupTrackingStore);
    await tick(0);

    // Assert
    expect(store.isEmpty()).toBe(true);
    expect(store.isLoading()).toBe(false);
  });
});
