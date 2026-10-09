import { byArrival, itemDetails, originLabel, originOf } from './kitchen-order';
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

describe('itemDetails', () => {
  it('should list the size, drink, extras and exclusions of a product', () => {
    // Arrange
    const item = {
      productName: 'Combo Clásico',
      quantity: 2,
      size: 'Grande',
      drink: 'Refresco de Cola',
      extras: ['Queso extra'],
      exclusions: ['Cebolla'],
    };

    // Act
    const details = itemDetails(item);

    // Assert
    expect(details).toEqual(['Grande', 'Refresco de Cola', '+ Queso extra', 'Sin cebolla']);
  });

  it('should return nothing when the product has no customization', () => {
    // Arrange
    const item = {
      productName: 'Limonada',
      quantity: 1,
      size: null,
      drink: null,
      extras: [],
      exclusions: [],
    };

    // Act / Assert
    expect(itemDetails(item)).toEqual([]);
  });
});
