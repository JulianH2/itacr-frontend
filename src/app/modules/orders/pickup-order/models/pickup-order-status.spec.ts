import type { PickupOrderStatus } from './pickup-order.models';
import { PICKUP_STATUS_TONES, pickupStatusHint, pickupStatusLabel } from './pickup-order-status';

describe('pickup order status', () => {
  it.each([
    ['New', 'Recibido', 'La cocina ya recibió tu pedido.', 'pending'],
    ['InPreparation', 'En preparación', 'Lo estamos preparando.', 'brand'],
    ['Ready', 'Listo para recoger', '¡Pasa a recogerlo y paga en el mostrador!', 'success'],
    ['Delivered', 'Entregado', 'Gracias por tu pedido.', 'neutral'],
  ] as const)('should describe the status %s to the customer', (status, label, hint, tone) => {
    // Act / Assert
    expect(pickupStatusLabel(status as PickupOrderStatus)).toBe(label);
    expect(pickupStatusHint(status as PickupOrderStatus)).toBe(hint);
    expect(PICKUP_STATUS_TONES[status as PickupOrderStatus]).toBe(tone);
  });
});
