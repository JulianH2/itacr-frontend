import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Badge with the number of units in the order in progress. */
@Component({
  selector: 'app-order-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="order-counter" role="status" [attr.aria-label]="accessibleLabel()">
      <span class="order-counter__label" aria-hidden="true">Pedido</span>
      <span class="order-counter__count" aria-hidden="true">{{ count() }}</span>
    </p>
  `,
  styles: `
    .order-counter {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 44px;
      margin: 0;
      padding: 0 16px;
      border-radius: 22px;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      font: var(--mat-sys-label-large);
    }

    .order-counter__count {
      min-width: 28px;
      padding: 2px 8px;
      border-radius: 14px;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      text-align: center;
    }
  `,
})
export class OrderCounterComponent {
  readonly count = input.required<number>();

  protected readonly accessibleLabel = computed(() => {
    const count = this.count();
    return `${count} ${count === 1 ? 'producto' : 'productos'} en el pedido`;
  });
}
