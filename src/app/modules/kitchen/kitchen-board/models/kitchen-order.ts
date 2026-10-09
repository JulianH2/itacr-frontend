import type { KitchenOrder, KitchenOrderItem } from './kitchen.models';

export type OrderOrigin = 'waiter' | 'pickup';

/** Waiter orders (at a table or to go) and orders the customer placed from the app to pick up. */
export function originOf(order: KitchenOrder): OrderOrigin {
  return order.channel === 'MobileApp' ? 'pickup' : 'waiter';
}

/** Text that tells the kitchen where an order comes from at a glance. */
export function originLabel(order: KitchenOrder): string {
  switch (order.channel) {
    case 'DineIn':
      return `Mesero · Mesa ${order.tableNumber ?? '?'}`;
    case 'TakeAway':
      return 'Mesero · Para llevar';
    case 'MobileApp':
      return 'Cliente · Para recoger';
  }
}

/** Oldest first: the queue is ordered by the time the order was created, whatever its channel. */
export function byArrival(first: KitchenOrder, second: KitchenOrder): number {
  return Date.parse(first.createdAt) - Date.parse(second.createdAt);
}

/** What the cook has to follow for one product: size, drink, `+ extra` and `Sin ingrediente`, one text per line. */
export function itemDetails(item: KitchenOrderItem): string[] {
  const choices = [item.size, item.drink].filter((choice): choice is string => choice !== null);
  return [
    ...choices,
    ...item.extras.map((extra) => `+ ${extra}`),
    ...item.exclusions.map((exclusion) => `Sin ${exclusion.toLowerCase()}`),
  ];
}
