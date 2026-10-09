export type TimerLevel = 'ok' | 'warning' | 'late';

/** Minutes after which the order timer turns yellow and red. Adjustable through `KITCHEN_TIMER_THRESHOLDS`. */
export interface TimerThresholds {
  readonly warningMinutes: number;
  readonly lateMinutes: number;
}

export const DEFAULT_TIMER_THRESHOLDS: TimerThresholds = { warningMinutes: 5, lateMinutes: 10 };

const MS_PER_MINUTE = 60_000;
const MS_PER_SECOND = 1000;

/** Green under 5 minutes, yellow from 5 to 10, red over 10 (with the default thresholds). */
export function timerLevel(
  elapsedMs: number,
  thresholds: TimerThresholds = DEFAULT_TIMER_THRESHOLDS,
): TimerLevel {
  const minutes = elapsedMs / MS_PER_MINUTE;
  if (minutes > thresholds.lateMinutes) {
    return 'late';
  }
  return minutes >= thresholds.warningMinutes ? 'warning' : 'ok';
}

/** `mm:ss`, with the minutes going past 59 instead of rolling over to hours. Never negative. */
export function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / MS_PER_SECOND));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
