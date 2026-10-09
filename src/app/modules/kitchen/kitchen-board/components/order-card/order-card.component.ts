import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { itemDetails, originLabel, originOf } from '../../models/kitchen-order';
import {
  DEFAULT_TIMER_THRESHOLDS,
  type TimerThresholds,
  formatElapsed,
  timerLevel,
} from '../../models/kitchen-timer';
import type { KitchenOrder } from '../../models/kitchen.models';

/** Card of one order: number, origin, products with their customization, and the timer. */
@Component({
  selector: 'app-order-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-card.component.html',
  styleUrl: './order-card.component.scss',
})
export class OrderCardComponent {
  readonly order = input.required<KitchenOrder>();
  /** Current server time in ms, shared by every card so the timers tick together. */
  readonly now = input.required<number>();
  readonly thresholds = input<TimerThresholds>(DEFAULT_TIMER_THRESHOLDS);

  protected readonly origin = computed(() => originOf(this.order()));
  protected readonly originText = computed(() => originLabel(this.order()));
  private readonly elapsedMs = computed(() => this.now() - Date.parse(this.order().createdAt));
  protected readonly elapsedText = computed(() => formatElapsed(this.elapsedMs()));
  protected readonly level = computed(() => timerLevel(this.elapsedMs(), this.thresholds()));
  protected readonly items = computed(() =>
    this.order().items.map((item) => ({ ...item, details: itemDetails(item) })),
  );
}
