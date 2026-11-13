import { firstValueFrom, type Observable } from 'rxjs';

import { MockKitchenApiService } from './mock-kitchen-api.service';

async function settle<T>(source: Observable<T>): Promise<T> {
  const result = firstValueFrom(source);
  await vi.advanceTimersByTimeAsync(1000);
  return result;
}

describe('MockKitchenApiService', () => {
  let service: MockKitchenApiService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new MockKitchenApiService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds new orders as the board keeps polling', async () => {
    const first = await settle(service.getQueue());
    let last = first;
    for (let poll = 0; poll < 30; poll++) {
      last = await settle(service.getQueue());
    }

    expect(last.orders.length).toBeGreaterThan(first.orders.length);
  });

  it('remembers the status the board gave to an order', async () => {
    const { orders } = await settle(service.getQueue());
    const target = orders[0];

    const change = await settle(service.changeStatus(target.id, 'Ready'));
    const queue = await settle(service.getQueue());

    expect(change).toMatchObject({ id: target.id, status: 'Ready' });
    expect(queue.orders.find((order) => order.id === target.id)?.status).toBe('Ready');
  });

  it('undoes the last change to the status it had before', async () => {
    const { orders } = await settle(service.getQueue());
    const target = orders[0];
    await settle(service.changeStatus(target.id, 'Ready'));

    const undone = await settle(service.undoStatusChange(target.id));

    expect(undone.status).toBe(target.status);
  });

  it('keeps the current status when there is nothing to undo', async () => {
    const { orders } = await settle(service.getQueue());
    const target = orders[0];

    const undone = await settle(service.undoStatusChange(target.id));

    expect(undone.status).toBe(target.status);
  });

  it('treats an order it does not know as New', async () => {
    const undone = await settle(service.undoStatusChange('unknown-order'));

    expect(undone).toMatchObject({ id: 'unknown-order', status: 'New' });
  });
});
