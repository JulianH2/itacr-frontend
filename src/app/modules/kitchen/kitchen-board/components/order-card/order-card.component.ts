import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import {
  itemDetails,
  nextKitchenStep,
  originLabel,
  originOf,
  statusLabel,
} from '../../models/kitchen-order';
import {
  DEFAULT_TIMER_THRESHOLDS,
  type TimerThresholds,
  formatElapsed,
  timerLevel,
} from '../../models/kitchen-timer';
import type { KitchenOrder } from '../../models/kitchen.models';

/** Card of one order: number, origin, products with their customization, and the timer. A tap moves it one step. */
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
  /** The change of this card is being saved, so taps are ignored. */
  readonly busy = input(false);

  readonly advance = output<KitchenOrder>();

  private readonly nextStep = computed(() => nextKitchenStep(this.order().status));
  protected readonly canAdvance = computed(() => this.nextStep() !== null);
  protected readonly actionLabel = computed(() => {
    const next = this.nextStep();
    return next === null
      ? ''
      : `Pasar el pedido ${this.order().orderNumber} a ${statusLabel(next)}`;
  });
  protected readonly hint = computed(() => {
    switch (this.order().status) {
      case 'New':
        return 'Toca para empezar';
      case 'InPreparation':
        return 'Toca cuando esté listo';
      case 'Ready':
        return 'Esperando al mesero';
    }
  });

  protected readonly origin = computed(() => originOf(this.order()));
  protected readonly originText = computed(() => originLabel(this.order()));
  private readonly elapsedMs = computed(() => this.now() - Date.parse(this.order().createdAt));
  protected readonly elapsedText = computed(() => formatElapsed(this.elapsedMs()));
  protected readonly level = computed(() => timerLevel(this.elapsedMs(), this.thresholds()));
  protected readonly items = computed(() =>
    this.order().items.map((item) => ({ ...item, details: itemDetails(item) })),
  );

  protected onTap(): void {
    if (!this.busy()) {
      this.advance.emit(this.order());
    }
  }
}
