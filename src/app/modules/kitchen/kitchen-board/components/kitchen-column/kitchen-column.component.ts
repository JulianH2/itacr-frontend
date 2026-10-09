import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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
            <app-order-card [order]="order" [now]="now()" [thresholds]="thresholds()" />
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
      gap: 12px;
      height: 100%;
    }

    .kitchen-column__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      border-radius: 12px;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }

    .kitchen-column__title {
      margin: 0;
      font: var(--mat-sys-headline-medium);
    }

    .kitchen-column__count {
      min-width: 44px;
      padding: 2px 12px;
      border-radius: 999px;
      background: var(--mat-sys-secondary);
      color: var(--mat-sys-on-secondary);
      font: var(--mat-sys-headline-small);
      text-align: center;
    }

    .kitchen-column__list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
  `,
})
export class KitchenColumnComponent {
  readonly title = input.required<string>();
  readonly orders = input.required<readonly KitchenOrder[]>();
  readonly now = input.required<number>();
  readonly thresholds = input<TimerThresholds>(DEFAULT_TIMER_THRESHOLDS);
}
