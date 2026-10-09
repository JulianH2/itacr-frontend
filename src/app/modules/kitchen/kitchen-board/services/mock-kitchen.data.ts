import type { KitchenOrder, KitchenQueue } from '../models/kitchen.models';

const MINUTE = 60_000;

/** A new order shows up on this poll and then on every NEW_ORDER_EVERY polls after it (to hear the alert). */
const FIRST_NEW_ORDER_CALL = 3;
const NEW_ORDER_EVERY = 3;

/** Ages of the fixed orders, picked so the three timer colors appear. */
function fixedOrders(now: number): readonly KitchenOrder[] {
  const at = (minutesAgo: number): string => new Date(now - minutesAgo * MINUTE).toISOString();
  return [
    {
      id: '60000000-0000-0000-0000-000000000001',
      orderNumber: 101,
      channel: 'DineIn',
      status: 'New',
      tableNumber: 4,
      createdAt: at(12),
      items: [
        {
          productName: 'Combo Clásico',
          quantity: 2,
          size: 'Grande',
          drink: 'Refresco de Cola',
          extras: ['Queso extra'],
          exclusions: ['Cebolla'],
        },
        {
          productName: 'Brownie con Helado',
          quantity: 1,
          size: null,
          drink: null,
          extras: [],
          exclusions: [],
        },
      ],
    },
    {
      id: '60000000-0000-0000-0000-000000000002',
      orderNumber: 102,
      channel: 'MobileApp',
      status: 'New',
      tableNumber: null,
      createdAt: at(7),
      items: [
        {
          productName: 'Hamburguesa Doble',
          quantity: 1,
          size: null,
          drink: null,
          extras: ['Tocino'],
          exclusions: [],
        },
      ],
    },
    {
      id: '60000000-0000-0000-0000-000000000003',
      orderNumber: 103,
      channel: 'TakeAway',
      status: 'InPreparation',
      tableNumber: null,
      createdAt: at(3),
      items: [
        {
          productName: 'Papas a la Francesa',
          quantity: 2,
          size: 'Mediana',
          drink: null,
          extras: [],
          exclusions: ['Sal'],
        },
        {
          productName: 'Limonada',
          quantity: 2,
          size: null,
          drink: null,
          extras: [],
          exclusions: [],
        },
      ],
    },
    {
      id: '60000000-0000-0000-0000-000000000004',
      orderNumber: 100,
      channel: 'DineIn',
      status: 'Ready',
      tableNumber: 9,
      createdAt: at(6),
      items: [
        {
          productName: 'Combo Pollo',
          quantity: 1,
          size: 'Mediana',
          drink: 'Agua Natural',
          extras: [],
          exclusions: [],
        },
      ],
    },
  ];
}

/** The mock queue at `now`; `call` counts the polls so new orders keep arriving. */
export function mockKitchenQueue(now: number, call: number): KitchenQueue {
  const arrivals =
    call < FIRST_NEW_ORDER_CALL
      ? 0
      : Math.floor((call - FIRST_NEW_ORDER_CALL) / NEW_ORDER_EVERY) + 1;
  const arrived: KitchenOrder[] = Array.from({ length: arrivals }, (_, index) => ({
    id: `60000000-0000-0000-0000-${String(100 + index).padStart(12, '0')}`,
    orderNumber: 104 + index,
    channel: index % 2 === 0 ? 'DineIn' : 'MobileApp',
    status: 'New',
    tableNumber: index % 2 === 0 ? 2 : null,
    createdAt: new Date(
      now - (call - FIRST_NEW_ORDER_CALL - index * NEW_ORDER_EVERY) * 5000,
    ).toISOString(),
    items: [
      {
        productName: 'Hamburguesa Clásica',
        quantity: 1,
        size: null,
        drink: null,
        extras: [],
        exclusions: [],
      },
    ],
  }));
  return { serverTime: new Date(now).toISOString(), orders: [...fixedOrders(now), ...arrived] };
}
