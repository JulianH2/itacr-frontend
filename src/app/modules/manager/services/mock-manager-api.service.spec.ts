import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, type Observable } from 'rxjs';

import { MockManagerApiService } from './mock-manager-api.service';

const DAY_MS = 24 * 60 * 60 * 1000;

async function settle<T>(source: Observable<T>): Promise<{ value?: T; error?: unknown }> {
  const result = firstValueFrom(source).then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );
  await vi.advanceTimersByTimeAsync(1000);
  return result;
}

describe('MockManagerApiService', () => {
  let service: MockManagerApiService;
  let from: string;
  let to: string;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-12T23:00:00'));
    service = new MockManagerApiService();
    to = new Date().toISOString();
    from = new Date(Date.now() - DAY_MS).toISOString();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds up the sample orders of the range by channel', async () => {
    const { value: dashboard } = await settle(service.getDashboard(from, to));

    expect(dashboard?.channels.map((channel) => channel.channel)).toEqual(['Waiter', 'Pickup']);
    expect(dashboard?.totalOrders).toBeGreaterThan(0);
    expect(dashboard?.totalOrders).toBe(
      dashboard?.channels.reduce((sum, channel) => sum + channel.orders, 0),
    );
    expect(dashboard?.sales).toBe(
      dashboard?.channels.reduce((sum, channel) => sum + channel.sales, 0),
    );
    expect(dashboard?.slowestChannel).toBe('Pickup');
    expect(dashboard?.trend.length).toBeGreaterThan(0);
  });

  it('has no orders, no slowest channel and no preparation time for an empty range', async () => {
    const { value: dashboard } = await settle(service.getDashboard(to, from));

    expect(dashboard?.totalOrders).toBe(0);
    expect(dashboard?.slowestChannel).toBeNull();
    expect(dashboard?.channels.every((channel) => channel.averagePreparationSeconds === null)).toBe(
      true,
    );
    expect(dashboard?.trend).toEqual([]);
  });

  it('keeps the trend in chronological order', async () => {
    const { value: dashboard } = await settle(service.getDashboard(from, to));

    const hours = dashboard?.trend.map((point) => point.hourStart) ?? [];
    expect(hours).toEqual([...hours].sort());
  });

  it('pages the orders, newest first', async () => {
    const query = { from, to, channel: null, status: null, page: 1, pageSize: 5 };
    const { value: first } = await settle(service.getOrders(query));
    const { value: second } = await settle(service.getOrders({ ...query, page: 2 }));

    expect(first?.items).toHaveLength(5);
    expect(first?.totalCount).toBeGreaterThan(5);
    expect(second?.items[0].id).not.toBe(first?.items[0].id);
    const created = first?.items.map((order) => order.createdAt) ?? [];
    expect(created).toEqual([...created].sort().reverse());
  });

  it('filters the orders by channel group and by status', async () => {
    const base = { from, to, channel: null, status: null, page: 1, pageSize: 500 };
    const { value: pickup } = await settle(service.getOrders({ ...base, channel: 'Pickup' }));
    const { value: waiter } = await settle(service.getOrders({ ...base, channel: 'Waiter' }));
    const { value: delivered } = await settle(service.getOrders({ ...base, status: 'Delivered' }));

    expect(pickup?.items.every((order) => order.channel === 'MobileApp')).toBe(true);
    expect(waiter?.items.every((order) => order.channel !== 'MobileApp')).toBe(true);
    expect(delivered?.items.every((order) => order.status === 'Delivered')).toBe(true);
  });

  it('lists the pending accounts and pin resets', async () => {
    const { value: requests } = await settle(service.getAccessRequests());

    expect(requests?.accounts).toHaveLength(2);
    expect(requests?.pinResets).toHaveLength(1);
  });

  it('removes an account once it is approved or rejected', async () => {
    await settle(service.approveAccount('mock-account-1'));
    await settle(service.rejectAccount('mock-account-2'));

    const { value: requests } = await settle(service.getAccessRequests());
    expect(requests?.accounts).toEqual([]);
  });

  it('answers 404 when the account does not exist or was already answered', async () => {
    await settle(service.approveAccount('mock-account-1'));

    const again = await settle(service.approveAccount('mock-account-1'));
    const unknown = await settle(service.rejectAccount('nobody'));

    expect((again.error as HttpErrorResponse).status).toBe(404);
    expect((unknown.error as HttpErrorResponse).status).toBe(404);
  });

  it('removes the pin reset once a temporary pin is assigned and answers 404 for an unknown one', async () => {
    await settle(service.assignTemporaryPin('mock-reset-1'));
    const { value: requests } = await settle(service.getAccessRequests());
    const unknown = await settle(service.assignTemporaryPin('mock-reset-1'));

    expect(requests?.pinResets).toEqual([]);
    expect((unknown.error as HttpErrorResponse).status).toBe(404);
  });
});
