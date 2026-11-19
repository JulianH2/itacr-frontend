import type { ManagerChannel, ManagerOrderChannel, ManagerOrderStatus } from './manager.models';

export const CHANNEL_LABELS: Readonly<Record<ManagerChannel, string>> = {
  Waiter: 'Mesero',
  Pickup: 'Para recoger',
};

export const STATUS_LABELS: Readonly<Record<ManagerOrderStatus, string>> = {
  New: 'Nuevo',
  InPreparation: 'En preparación',
  Ready: 'Listo',
  Delivered: 'Entregado',
};

/** Where an order of the table goes: the table of a waiter, to take away, or the customer's pickup. */
export function orderChannelLabel(
  channel: ManagerOrderChannel,
  tableNumber: number | null,
): string {
  if (channel === 'MobileApp') {
    return CHANNEL_LABELS.Pickup;
  }
  return channel === 'DineIn' && tableNumber !== null
    ? `Mesero · Mesa ${tableNumber}`
    : 'Mesero · Para llevar';
}

/** A time to prepare, short enough for a tile: `45 s`, `12 min`, `1 h 05 min`. A missing time is a dash. */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) {
    return '—';
  }
  if (seconds < 60) {
    return `${seconds} s`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}
