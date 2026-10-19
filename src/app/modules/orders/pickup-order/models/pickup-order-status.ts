import type { BadgeTone } from '@shared/components/status-badge/status-badge.component';

import type { PickupOrderStatus } from './pickup-order.models';

/** What the customer reads for each status. */
export function pickupStatusLabel(status: PickupOrderStatus): string {
  switch (status) {
    case 'New':
      return 'Recibido';
    case 'InPreparation':
      return 'En preparación';
    case 'Ready':
      return 'Listo para recoger';
    case 'Delivered':
      return 'Entregado';
  }
}

/** A sentence under the status that says what to do next. */
export function pickupStatusHint(status: PickupOrderStatus): string {
  switch (status) {
    case 'New':
      return 'La cocina ya recibió tu pedido.';
    case 'InPreparation':
      return 'Lo estamos preparando.';
    case 'Ready':
      return '¡Pasa a recogerlo y paga en el mostrador!';
    case 'Delivered':
      return 'Gracias por tu pedido.';
  }
}

/** Waiting is neutral, cooking is brand, and ready is the only success. */
export const PICKUP_STATUS_TONES: Readonly<Record<PickupOrderStatus, BadgeTone>> = {
  New: 'pending',
  InPreparation: 'brand',
  Ready: 'success',
  Delivered: 'neutral',
};
