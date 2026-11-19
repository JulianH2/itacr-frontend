/** A range of days of the restaurant, as the dates of the local calendar (`yyyy-mm-dd`), both included. */
export interface DayRange {
  readonly start: string;
  readonly end: string;
}

/** The API takes a range of at most this many days. */
export const MAX_RANGE_DAYS = 31;

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `yyyy-mm-dd` of a local date. */
export function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The local midnight that starts the day written as `yyyy-mm-dd`. */
export function startOfDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function todayRange(now = new Date()): DayRange {
  const today = toDateInput(now);
  return { start: today, end: today };
}

export function yesterdayRange(now = new Date()): DayRange {
  const yesterday = toDateInput(addDays(now, -1));
  return { start: yesterday, end: yesterday };
}

export function lastDaysRange(days: number, now = new Date()): DayRange {
  return { start: toDateInput(addDays(now, -(days - 1))), end: toDateInput(now) };
}

/**
 * The two UTC instants the API takes: the start of the first day and the start of the day after the last one, both in the
 * time of the restaurant (the device), so "today" is the day of the people who work there.
 */
export function toInstants(range: DayRange): { readonly from: string; readonly to: string } {
  const start = startOfDay(range.start);
  const afterEnd = addDays(startOfDay(range.end), 1);
  return { from: start.toISOString(), to: afterEnd.toISOString() };
}

export function daysIn(range: DayRange): number {
  return Math.round(
    (addDays(startOfDay(range.end), 1).getTime() - startOfDay(range.start).getTime()) / DAY_MS,
  );
}

/** Why a range cannot be asked for, in Spanish, or null when it can. */
export function rangeError(range: DayRange): string | null {
  if (range.start === '' || range.end === '') {
    return 'Elige las dos fechas.';
  }
  if (range.end < range.start) {
    return 'La fecha inicial debe ser anterior a la final.';
  }
  return daysIn(range) > MAX_RANGE_DAYS
    ? `El rango no puede ser mayor a ${MAX_RANGE_DAYS} días.`
    : null;
}

export function sameRange(a: DayRange, b: DayRange): boolean {
  return a.start === b.start && a.end === b.end;
}
