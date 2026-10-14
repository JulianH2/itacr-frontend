import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { IconComponent } from '@shared/components/icon/icon.component';

const CART_ICON_SIZE = 20;

/** Badge with the number of units in the order in progress. */
@Component({
  selector: 'app-order-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <p class="order-counter" role="status" [attr.aria-label]="accessibleLabel()">
      <app-icon name="cart" [size]="cartSize" />
      <span class="order-counter__label" aria-hidden="true">Pedido</span>
      <span class="order-counter__count tabular" aria-hidden="true">{{ count() }}</span>
    </p>
  `,
  styles: `
    .order-counter {
      align-items: center;
      background: var(--color-secondary-tint);
      border-radius: var(--radius-pill);
      color: var(--color-text);
      display: inline-flex;
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
      gap: var(--space-1);
      margin: 0;
      min-height: var(--touch-target);
      padding: 0 var(--space-2);
    }

    .order-counter__count {
      background: var(--color-primary);
      border-radius: var(--radius-pill);
      color: var(--color-on-primary);
      min-width: var(--space-3);
      padding: 2px var(--space-1);
      text-align: center;
    }
  `,
})
export class OrderCounterComponent {
  readonly count = input.required<number>();

  protected readonly cartSize = CART_ICON_SIZE;
  protected readonly accessibleLabel = computed(() => {
    const count = this.count();
    return `${count} ${count === 1 ? 'producto' : 'productos'} en el pedido`;
  });
}
