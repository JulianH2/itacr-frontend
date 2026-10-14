import type { OrderStatus } from './take-order.models';

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'New':
      return 'Nuevo';
    case 'InPreparation':
      return 'En preparación';
    case 'Ready':
      return 'Listo';
    case 'Delivered':
      return 'Entregado';
  }
}

export function destinationLabel(tableNumber: number | null): string {
  return tableNumber === null ? 'Para llevar' : `Mesa ${tableNumber}`;
}

const TIME_FORMAT = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' });

/** Local time of an instant sent by the API, e.g. `2:35 p.m.` */
export function formatTime(instant: string): string {
  return TIME_FORMAT.format(new Date(instant));
}
