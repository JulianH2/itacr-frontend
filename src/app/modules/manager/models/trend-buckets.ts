import type { TrendPoint } from './manager.models';

/** A bar of the trend chart: an hour, or a day when the range is long. */
export interface TrendBucket {
  readonly start: Date;
  /** Short label for the axis and the tooltip, in the time of the restaurant. */
  readonly label: string;
  readonly orders: number;
  readonly sales: number;
}

const HOUR_MS = 60 * 60 * 1000;
/** Up to this many hours the chart has one bar per hour; beyond it, one bar per day. */
export const MAX_HOURLY_RANGE_HOURS = 48;

const HOUR_LABEL = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', hour12: true });
const DAY_LABEL = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' });
const HOUR_WITH_DAY_LABEL = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  hour12: true,
});

function dayKey(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * The bars of the chart for a range: every hour of it when it is short (the hours without orders are zero, so the shape of the day
 * is honest), or every day when it is long, adding up the hours the API sends. The hours of UTC are whole hours of Mexico, so the
 * hours of the API fit the hours of the restaurant.
 */
export function buildBuckets(
  points: readonly TrendPoint[],
  from: string,
  to: string,
): TrendBucket[] {
  const start = new Date(from);
  const end = new Date(to);
  const hours = Math.round((end.getTime() - start.getTime()) / HOUR_MS);

  if (hours <= MAX_HOURLY_RANGE_HOURS) {
    const byHour = new Map(points.map((point) => [new Date(point.hourStart).getTime(), point]));
    const showDay = hours > 24;
    return Array.from({ length: Math.max(hours, 0) }, (_, index) => {
      const hourStart = new Date(start.getTime() + index * HOUR_MS);
      const point = byHour.get(hourStart.getTime());
      return {
        start: hourStart,
        label: (showDay ? HOUR_WITH_DAY_LABEL : HOUR_LABEL).format(hourStart),
        orders: point?.orders ?? 0,
        sales: point?.sales ?? 0,
      };
    });
  }

  const byDay = new Map<number, { orders: number; sales: number }>();
  for (const point of points) {
    const key = dayKey(new Date(point.hourStart));
    const total = byDay.get(key) ?? { orders: 0, sales: 0 };
    byDay.set(key, { orders: total.orders + point.orders, sales: total.sales + point.sales });
  }
  const buckets: TrendBucket[] = [];
  for (
    let day = new Date(dayKey(start));
    day < end;
    day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
  ) {
    const total = byDay.get(day.getTime());
    buckets.push({
      start: day,
      label: DAY_LABEL.format(day),
      orders: total?.orders ?? 0,
      sales: total?.sales ?? 0,
    });
  }
  return buckets;
}
