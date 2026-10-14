import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

import { IconComponent } from '../icon/icon.component';

const STEPPER_ICON_SIZE = 18;

/** − / + quantity control with 44px targets. `subject` names the item for screen readers. */
@Component({
  selector: 'app-qty-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="qty">
      <button
        type="button"
        class="qty__button"
        [disabled]="atMin()"
        [attr.aria-label]="'Quitar uno de ' + subject()"
        (click)="value.set(value() - 1)"
      >
        <app-icon name="minus" [size]="iconSize" />
      </button>
      <span class="qty__value tabular" [attr.aria-label]="value() + ' unidades'">{{
        value()
      }}</span>
      <button
        type="button"
        class="qty__button"
        [disabled]="atMax()"
        [attr.aria-label]="'Agregar uno de ' + subject()"
        (click)="value.set(value() + 1)"
      >
        <app-icon name="plus" [size]="iconSize" />
      </button>
    </div>
  `,
  styles: `
    .qty {
      align-items: center;
      display: inline-flex;
      font-family: var(--font-family);
      gap: var(--space-1);
    }

    .qty__button {
      align-items: center;
      background: transparent;
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-control);
      color: var(--color-text);
      cursor: pointer;
      display: inline-flex;
      height: var(--touch-target);
      justify-content: center;
      transition:
        background-color var(--duration-fast) var(--ease-standard),
        transform var(--duration-fast) var(--ease-standard);
      width: var(--touch-target);
    }

    .qty__button:active:not(:disabled) {
      background: var(--color-primary-tint-pressed);
      transform: scale(0.94);
    }

    .qty__button:disabled {
      border-color: var(--color-divider);
      color: var(--color-text-disabled);
      cursor: default;
    }

    @media (hover: hover) {
      .qty__button:hover:not(:disabled) {
        background: var(--color-primary-tint);
      }
    }

    .qty__value {
      font: var(--mat-sys-title-medium);
      font-family: var(--font-family);
      min-width: var(--space-3);
      text-align: center;
    }
  `,
})
export class QtyStepperComponent {
  readonly value = model(1);
  readonly subject = input.required<string>();
  readonly min = input(0);
  readonly max = input(Number.MAX_SAFE_INTEGER);

  protected readonly iconSize = STEPPER_ICON_SIZE;
  protected readonly atMin = computed(() => this.value() <= this.min());
  protected readonly atMax = computed(() => this.value() >= this.max());
}
