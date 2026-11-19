import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, type Observable } from 'rxjs';

import type { CreateOrderRequest } from '../models/take-order.models';
import { MockOrdersApiService } from './mock-orders-api.service';

async function settle<T>(source: Observable<T>): Promise<{ value?: T; error?: HttpErrorResponse }> {
  const result = firstValueFrom(source).then(
    (value) => ({ value }),
    (error: HttpErrorResponse) => ({ error }),
  );
  await vi.advanceTimersByTimeAsync(1000);
  return result;
}

function request(
  clientOrderId: string,
  overrides: Partial<CreateOrderRequest> = {},
): CreateOrderRequest {
  return {
    clientOrderId,
    tableId: '40000000-0000-0000-0000-000000000003',
    takeAway: false,
    items: [{ productId: 'Combo Clásico', quantity: 2 }],
    ...overrides,
  };
}

describe('MockOrdersApiService', () => {
  let service: MockOrdersApiService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new MockOrdersApiService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('seeds the ten dining tables of the database', async () => {
    const { value: tables } = await settle(service.getDiningTables());

    expect(tables).toHaveLength(10);
    expect(tables?.[2]).toEqual({ id: '40000000-0000-0000-0000-000000000003', number: 3 });
  });

  it('numbers the orders from 1 and keeps the table and channel of the request', async () => {
    const { value: dineIn } = await settle(service.createOrder(request('a')));
    const { value: takeAway } = await settle(
      service.createOrder(request('b', { takeAway: true, tableId: null })),
    );

    expect(dineIn).toMatchObject({ orderNumber: 1, channel: 'DineIn', tableNumber: 3 });
    expect(takeAway).toMatchObject({ orderNumber: 2, channel: 'TakeAway', tableNumber: null });
  });

  it('returns the same order when the clientOrderId is repeated', async () => {
    const { value: first } = await settle(service.createOrder(request('a')));
    const { value: again } = await settle(service.createOrder(request('a')));

    expect(again).toEqual(first);
    const { value: active } = await settle(service.getActiveOrders());
    expect(active).toHaveLength(1);
  });

  it('keeps the time the waiter sent an order that waited offline', async () => {
    const createdAt = '2026-10-01T12:00:00.000Z';

    const { value: order } = await settle(service.createOrder(request('a', { createdAt })));

    expect(order?.createdAt).toBe(createdAt);
  });

  it('lists the active orders, newest first', async () => {
    await settle(service.createOrder(request('a')));
    await settle(service.createOrder(request('b')));

    const { value: active } = await settle(service.getActiveOrders());

    expect(active?.map((order) => order.orderNumber)).toEqual([2, 1]);
  });

  it('shows the detail of an order with its first status in the timeline', async () => {
    const { value: placed } = await settle(service.createOrder(request('a')));

    const { value: detail } = await settle(service.getOrder(placed?.id ?? ''));

    expect(detail).toMatchObject({ orderNumber: 1, status: 'New', notes: [], modifiedAt: null });
    expect(detail?.timeline).toEqual([
      { status: 'New', changedAt: placed?.createdAt, undone: false },
    ]);
  });

  it('answers 404 for an order that does not exist', async () => {
    const detail = await settle(service.getOrder('nobody'));
    const update = await settle(service.updateOrder('nobody', { tableId: null, items: [] }));
    const deliver = await settle(service.deliverOrder('nobody'));

    expect(detail.error?.status).toBe(404);
    expect(update.error?.status).toBe(404);
    expect(deliver.error?.status).toBe(404);
  });

  it('replaces the products, moves the table and accumulates the notes when an order is updated', async () => {
    vi.setSystemTime(new Date('2026-11-13T12:00:00Z'));
    const { value: placed } = await settle(service.createOrder(request('a')));
    const id = placed?.id ?? '';

    await settle(
      service.updateOrder(id, {
        tableId: '40000000-0000-0000-0000-000000000005',
        items: [{ productId: 'Combo Doble', quantity: 1 }],
        note: 'Sin cebolla',
      }),
    );
    const { value: detail } = await settle(
      service.updateOrder(id, {
        tableId: null,
        items: [{ productId: 'Combo Doble', quantity: 3 }],
      }),
    );

    expect(detail?.items).toMatchObject([{ productId: 'Combo Doble', quantity: 3 }]);
    expect(detail?.tableNumber).toBeNull();
    expect(detail?.notes).toEqual(['Sin cebolla']);
    expect(detail?.modifiedAt).toBe('2026-11-13T12:00:02.000Z');
  });

  it('does not let an order lose all its products', async () => {
    const { value: placed } = await settle(service.createOrder(request('a')));

    const { error } = await settle(
      service.updateOrder(placed?.id ?? '', { tableId: null, items: [] }),
    );

    expect(error?.status).toBe(400);
    expect(JSON.stringify(error?.error)).toContain('sin productos');
  });

  it('refuses to deliver an order the kitchen has not marked as ready', async () => {
    const { value: placed } = await settle(service.createOrder(request('a')));

    const { error } = await settle(service.deliverOrder(placed?.id ?? ''));

    expect(error?.status).toBe(409);
  });

  it('has no ready pickup orders', async () => {
    const { value: ready } = await settle(service.getReadyPickupOrders());

    expect(ready).toEqual([]);
  });
});
