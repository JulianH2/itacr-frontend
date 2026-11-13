import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, type Observable } from 'rxjs';

import type { CreatePickupOrderRequest } from '../models/pickup-order.models';
import { MockPickupApiService } from './mock-pickup-api.service';

const STEP_MS = 12_000;
const COMBO_CLASICO_ID = '20000000-0000-0000-0000-000000000001';

async function settle<T>(source: Observable<T>): Promise<{ value?: T; error?: HttpErrorResponse }> {
  const result = firstValueFrom(source).then(
    (value) => ({ value }),
    (error: HttpErrorResponse) => ({ error }),
  );
  await vi.advanceTimersByTimeAsync(1000);
  return result;
}

function request(clientOrderId: string, phone = '5512345678'): CreatePickupOrderRequest {
  return {
    clientOrderId,
    name: 'Ana',
    phone,
    items: [
      { productId: COMBO_CLASICO_ID, quantity: 2 },
      { productId: 'unknown-product', quantity: 1 },
    ],
  };
}

describe('MockPickupApiService', () => {
  let service: MockPickupApiService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-13T12:00:00Z'));
    service = new MockPickupApiService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prices the known products of the menu and gives a placeholder to unknown ones', async () => {
    const { value: order } = await settle(service.createOrder(request('a')));

    expect(order).toMatchObject({ orderNumber: 200, status: 'New', total: 238 });
    expect(order?.items).toEqual([
      { name: 'Combo Clásico', quantity: 2, unitPrice: 119, subtotal: 238 },
      { name: 'Producto', quantity: 1, unitPrice: 0, subtotal: 0 },
    ]);
  });

  it('never returns the phone of the customer', async () => {
    const { value: order } = await settle(service.createOrder(request('a')));

    expect(JSON.stringify(order)).not.toContain('5512345678');
  });

  it('returns the same order when the clientOrderId is repeated', async () => {
    const { value: first } = await settle(service.createOrder(request('a')));
    const { value: again } = await settle(service.createOrder(request('a')));

    expect(again).toEqual(first);
  });

  it('advances the status with time until it is delivered', async () => {
    await settle(service.createOrder(request('a')));
    const statuses: (string | undefined)[] = [];

    for (const steps of [1, 1, 1, 1]) {
      vi.setSystemTime(Date.now() + steps * STEP_MS);
      statuses.push((await settle(service.getOrder('a'))).value?.status);
    }

    expect(statuses).toEqual(['InPreparation', 'Ready', 'Delivered', 'Delivered']);
  });

  it('allows two active orders per phone and refuses the third with 409', async () => {
    await settle(service.createOrder(request('a')));
    await settle(service.createOrder(request('b')));

    const third = await settle(service.createOrder(request('c')));
    const otherPhone = await settle(service.createOrder(request('d', '5598765432')));

    expect(third.error?.status).toBe(409);
    expect(third.error?.error.detail).toContain('2 pedidos en curso');
    expect(otherPhone.value?.orderNumber).toBe(202);
  });

  it('lets the phone order again once an order was delivered', async () => {
    await settle(service.createOrder(request('a')));
    await settle(service.createOrder(request('b')));
    vi.setSystemTime(Date.now() + 3 * STEP_MS);

    const { value: third } = await settle(service.createOrder(request('c')));

    expect(third?.status).toBe('New');
  });

  it('answers 404 for an order that does not exist', async () => {
    const { error } = await settle(service.getOrder('nobody'));

    expect(error?.status).toBe(404);
  });
});
