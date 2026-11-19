import {
  daysIn,
  lastDaysRange,
  rangeError,
  sameRange,
  todayRange,
  toInstants,
  yesterdayRange,
} from './date-range';

const NOW = new Date(2026, 10, 10, 15, 30);

describe('date range of the dashboard', () => {
  it('should start the day of the restaurant at its local midnight and end it at the next one', () => {
    // Act
    const instants = toInstants(todayRange(NOW));

    // Assert
    expect(instants.from).toBe(new Date(2026, 10, 10).toISOString());
    expect(instants.to).toBe(new Date(2026, 10, 11).toISOString());
  });

  it('should include the last day of a range of several days', () => {
    // Act
    const instants = toInstants(lastDaysRange(7, NOW));

    // Assert
    expect(instants.from).toBe(new Date(2026, 10, 4).toISOString());
    expect(instants.to).toBe(new Date(2026, 10, 11).toISOString());
  });

  it('should give yesterday and the last days from the calendar', () => {
    expect(yesterdayRange(NOW)).toEqual({ start: '2026-11-09', end: '2026-11-09' });
    expect(lastDaysRange(7, NOW)).toEqual({ start: '2026-11-04', end: '2026-11-10' });
    expect(todayRange(NOW)).toEqual({ start: '2026-11-10', end: '2026-11-10' });
  });

  it('should count the days of a range, both included', () => {
    expect(daysIn({ start: '2026-11-10', end: '2026-11-10' })).toBe(1);
    expect(daysIn({ start: '2026-11-04', end: '2026-11-10' })).toBe(7);
  });

  it.each([
    [{ start: '', end: '2026-11-10' }, 'Elige las dos fechas.'],
    [{ start: '2026-11-10', end: '' }, 'Elige las dos fechas.'],
    [{ start: '2026-11-11', end: '2026-11-10' }, 'La fecha inicial debe ser anterior a la final.'],
    [{ start: '2026-10-01', end: '2026-11-10' }, 'El rango no puede ser mayor a 31 días.'],
  ])('should explain why %j cannot be asked for', (range, message) => {
    expect(rangeError(range)).toBe(message);
  });

  it('should accept a range of one day and one of 31 days', () => {
    expect(rangeError({ start: '2026-11-10', end: '2026-11-10' })).toBeNull();
    expect(rangeError({ start: '2026-10-11', end: '2026-11-10' })).toBeNull();
  });

  it('should tell whether two ranges are the same', () => {
    expect(sameRange(todayRange(NOW), todayRange(NOW))).toBe(true);
    expect(sameRange(todayRange(NOW), yesterdayRange(NOW))).toBe(false);
  });
});
