import { toInstants } from './date-range';
import type { TrendPoint } from './manager.models';
import { buildBuckets } from './trend-buckets';

function point(date: Date, orders: number, sales: number): TrendPoint {
  return { hourStart: date.toISOString(), orders, sales };
}

describe('buildBuckets', () => {
  const today = toInstants({ start: '2026-11-10', end: '2026-11-10' });

  it('should give one bar for each hour of a day, with zeros where nothing happened', () => {
    // Arrange
    const points = [
      point(new Date(2026, 10, 10, 12), 3, 100),
      point(new Date(2026, 10, 10, 13), 0, 130),
    ];

    // Act
    const buckets = buildBuckets(points, today.from, today.to);

    // Assert
    expect(buckets).toHaveLength(24);
    expect(buckets[12]).toMatchObject({ orders: 3, sales: 100 });
    expect(buckets[13]).toMatchObject({ orders: 0, sales: 130 });
    expect(buckets[0]).toMatchObject({ orders: 0, sales: 0 });
  });

  it('should keep the hours in order, the first one being the start of the range', () => {
    // Act
    const buckets = buildBuckets([], today.from, today.to);

    // Assert
    expect(buckets[0].start.toISOString()).toBe(today.from);
    expect(buckets[23].start.getTime() - buckets[0].start.getTime()).toBe(23 * 60 * 60 * 1000);
  });

  it('should still give an hourly bar for a range of two days', () => {
    // Arrange
    const range = toInstants({ start: '2026-11-09', end: '2026-11-10' });

    // Assert
    expect(buildBuckets([], range.from, range.to)).toHaveLength(48);
  });

  it('should add the hours up into one bar for each day when the range is long', () => {
    // Arrange
    const range = toInstants({ start: '2026-11-04', end: '2026-11-10' });
    const points = [
      point(new Date(2026, 10, 4, 12), 2, 100),
      point(new Date(2026, 10, 4, 18), 1, 50),
      point(new Date(2026, 10, 10, 9), 4, 400),
    ];

    // Act
    const buckets = buildBuckets(points, range.from, range.to);

    // Assert
    expect(buckets).toHaveLength(7);
    expect(buckets[0]).toMatchObject({ orders: 3, sales: 150 });
    expect(buckets[6]).toMatchObject({ orders: 4, sales: 400 });
    expect(buckets.slice(1, 6).every((bucket) => bucket.orders === 0 && bucket.sales === 0)).toBe(
      true,
    );
  });

  it('should give no bar for an empty range', () => {
    expect(buildBuckets([], today.from, today.from)).toEqual([]);
  });
});
