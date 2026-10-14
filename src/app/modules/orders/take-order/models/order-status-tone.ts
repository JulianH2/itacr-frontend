import type { BadgeTone } from '@shared/components/status-badge/status-badge.component';
import type { OrderStatus } from './take-order.models';

/** Badge color of each order status: waiting is neutral, cooking is brand, ready is the only sage. */
export const ORDER_STATUS_TONES: Readonly<Record<OrderStatus, BadgeTone>> = {
  New: 'pending',
  InPreparation: 'brand',
  Ready: 'success',
  Delivered: 'neutral',
};
