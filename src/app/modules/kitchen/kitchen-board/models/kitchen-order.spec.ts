import { byArrival, originLabel, originOf } from './kitchen-order';
import type { KitchenOrder } from './kitchen.models';

function order(overrides: Partial<KitchenOrder>): KitchenOrder {
  return {
    id: 'order',
    orderNumber: 1,
    channel: 'DineIn',
    status: 'New',
    tableNumber: 3,
    createdAt: '2026-10-09T18:00:00Z',
    items: [],
    ...overrides,
  };
}

describe('originLabel', () => {
  // CA2: each card says clearly where the order comes from.
  it.each([
    [order({ channel: 'DineIn', tableNumber: 7 }), 'Mesero · Mesa 7', 'waiter'],
    [order({ channel: 'TakeAway', tableNumber: null }), 'Mesero · Para llevar', 'waiter'],
    [order({ channel: 'MobileApp', tableNumber: null }), 'Cliente · Para recoger', 'pickup'],
  ] as const)('should describe the origin of a %#th order', (kitchenOrder, label, origin) => {
    // Act / Assert
    expect(originLabel(kitchenOrder)).toBe(label);
    expect(originOf(kitchenOrder)).toBe(origin);
  });
});

describe('byArrival', () => {
  it('should put the oldest order first whatever its channel', () => {
    // Arrange
    const pickup = order({ id: 'a', channel: 'MobileApp', createdAt: '2026-10-09T18:02:00Z' });
    const waiter = order({ id: 'b', channel: 'DineIn', createdAt: '2026-10-09T18:01:00Z' });
    const synced = order({ id: 'c', createdAt: '2026-10-09T17:55:00Z' });

    // Act
    const sorted = [pickup, waiter, synced].sort(byArrival).map((item) => item.id);

    // Assert
    expect(sorted).toEqual(['c', 'b', 'a']);
  });
});
