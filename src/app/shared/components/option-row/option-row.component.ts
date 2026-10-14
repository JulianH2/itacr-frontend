import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

import { IconComponent } from '../icon/icon.component';

const CHECK_ICON_SIZE = 16;

/** Extras / exclusions row: name on the left, price delta and a checkbox on the right. */
@Component({
  selector: 'app-option-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <label class="option">
      <input
        class="option__input"
        type="checkbox"
        [checked]="checked()"
        (change)="onChange($event)"
      />
      <span class="option__label">{{ label() }}</span>
      @if (detail(); as detail) {
        <span class="option__detail tabular">{{ detail }}</span>
      }
      <span class="option__box" aria-hidden="true">
        <app-icon name="check" [size]="checkSize" />
      </span>
    </label>
  `,
  styles: `
    .option {
      align-items: center;
      background: var(--color-surface);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-card);
      cursor: pointer;
      display: flex;
      font: var(--mat-sys-body-large);
      font-family: var(--font-family);
      gap: var(--space-2);
      min-height: var(--touch-target);
      padding: var(--space-1-5) var(--space-2);
      position: relative;
      transition: border-color var(--duration-fast) var(--ease-standard);
    }

    .option__input {
      inset: 0;
      margin: 0;
      opacity: 0;
      position: absolute;
    }

    .option__label {
      flex: 1;
    }

    .option__detail {
      color: var(--color-text-secondary);
      font: var(--mat-sys-body-small);
      font-family: var(--font-family);
    }

    .option__box {
      align-items: center;
      border: 1.5px solid var(--color-border-strong);
      border-radius: var(--radius-control);
      color: transparent;
      display: inline-flex;
      height: var(--space-3);
      justify-content: center;
      transition:
        background-color var(--duration-fast) var(--ease-standard),
        border-color var(--duration-fast) var(--ease-standard);
      width: var(--space-3);
    }

    .option__input:checked ~ .option__box {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .option:has(.option__input:checked) {
      border-color: var(--color-primary);
    }

    .option:has(.option__input:focus-visible) {
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }

    @media (hover: hover) {
      .option:hover {
        border-color: var(--color-border-strong);
      }
    }
  `,
})
export class OptionRowComponent {
  readonly label = input.required<string>();
  readonly detail = input('');
  readonly checked = model(false);

  protected readonly checkSize = CHECK_ICON_SIZE;

  protected onChange(event: Event): void {
    this.checked.set((event.target as HTMLInputElement).checked);
  }
}
