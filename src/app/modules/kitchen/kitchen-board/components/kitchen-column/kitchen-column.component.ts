import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { DEFAULT_TIMER_THRESHOLDS, type TimerThresholds } from '../../models/kitchen-timer';
import type { KitchenOrder } from '../../models/kitchen.models';
import { OrderCardComponent } from '../order-card/order-card.component';

/** One column of the board (Nuevos, En preparación or Listos) with its orders, oldest first. */
@Component({
  selector: 'app-kitchen-column',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrderCardComponent],
  template: `
    <section class="kitchen-column" [attr.aria-label]="title()">
      <header class="kitchen-column__header">
        <h2 class="kitchen-column__title">{{ title() }}</h2>
        <span class="kitchen-column__count" [attr.aria-label]="orders().length + ' pedidos'">
          {{ orders().length }}
        </span>
      </header>
      <ul class="kitchen-column__list">
        @for (order of orders(); track order.id) {
          <li>
            <app-order-card
              [order]="order"
              [now]="now()"
              [thresholds]="thresholds()"
              [busy]="busyIds().has(order.id)"
              (advance)="advance.emit($event)"
            />
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .kitchen-column {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      height: 100%;
    }

    .kitchen-column__header {
      align-items: center;
      display: flex;
      gap: var(--space-1);
      justify-content: space-between;
      padding: 0 var(--space-half);
    }

    .kitchen-column__title {
      font: var(--mat-sys-title-large);
      font-family: var(--font-family);
      margin: 0;
    }

    .kitchen-column__count {
      background: var(--color-secondary-tint);
      border-radius: var(--radius-pill);
      color: var(--color-text-secondary);
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
      font-variant-numeric: tabular-nums;
      min-width: var(--space-3);
      padding: 2px var(--space-1);
      text-align: center;
    }

    // A card that moves into this column settles in instead of appearing out of nowhere.
    .kitchen-column__list > li {
      animation: card-in var(--duration-slow) var(--ease-standard) both;
    }

    @keyframes card-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }

    .kitchen-column__list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      list-style: none;
      margin: 0;
      padding: 0;
    }
  `,
})
export class KitchenColumnComponent {
  readonly title = input.required<string>();
  readonly orders = input.required<readonly KitchenOrder[]>();
  readonly now = input.required<number>();
  readonly thresholds = input<TimerThresholds>(DEFAULT_TIMER_THRESHOLDS);
  readonly busyIds = input<ReadonlySet<string>>(new Set());

  readonly advance = output<KitchenOrder>();
}
