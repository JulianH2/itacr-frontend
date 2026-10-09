import { DEFAULT_TIMER_THRESHOLDS, formatElapsed, timerLevel } from './kitchen-timer';

const MINUTE = 60_000;

describe('timerLevel', () => {
  // Business rule of HU_04: green under 5 minutes, yellow from 5 to 10, red over 10.
  it.each([
    [0, 'ok'],
    [4 * MINUTE + 59_000, 'ok'],
    [5 * MINUTE, 'warning'],
    [10 * MINUTE, 'warning'],
    [10 * MINUTE + 1000, 'late'],
    [45 * MINUTE, 'late'],
  ] as const)(
    'should return the level of %i ms when using the default thresholds',
    (elapsed, level) => {
      // Act
      const result = timerLevel(elapsed);

      // Assert
      expect(result).toBe(level);
    },
  );

  it('should use the thresholds it is given when they are adjusted', () => {
    // Arrange
    const thresholds = { warningMinutes: 2, lateMinutes: 4 };

    // Act
    const levels = [MINUTE, 3 * MINUTE, 5 * MINUTE].map((elapsed) =>
      timerLevel(elapsed, thresholds),
    );

    // Assert
    expect(levels).toEqual(['ok', 'warning', 'late']);
    expect(DEFAULT_TIMER_THRESHOLDS).toEqual({ warningMinutes: 5, lateMinutes: 10 });
  });
});

describe('formatElapsed', () => {
  it.each([
    [0, '00:00'],
    [65_000, '01:05'],
    [754_000, '12:34'],
    [75 * MINUTE, '75:00'],
    [-5000, '00:00'],
  ] as const)('should format %i ms as %s', (elapsed, text) => {
    // Act
    const result = formatElapsed(elapsed);

    // Assert
    expect(result).toBe(text);
  });
});
