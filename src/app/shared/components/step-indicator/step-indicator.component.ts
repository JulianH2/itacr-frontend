import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent } from '../icon/icon.component';

const STEP_CHECK_SIZE = 18;

/** Numbered progress for a real sequence (the order wizard): done steps are sage, the current one is wine. */
@Component({
  selector: 'app-step-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <ol class="steps" [attr.aria-label]="'Paso ' + (current() + 1) + ' de ' + steps().length">
      @for (step of steps(); track step; let index = $index) {
        <li
          class="steps__item"
          [class.steps__item--done]="index < current()"
          [class.steps__item--current]="index === current()"
          [attr.aria-current]="index === current() ? 'step' : null"
        >
          <span class="steps__marker">
            @if (index < current()) {
              <app-icon name="check" [size]="checkSize" />
            } @else {
              {{ index + 1 }}
            }
          </span>
          <span class="steps__label">{{ step }}</span>
        </li>
      }
    </ol>
  `,
  styles: `
    .steps {
      display: flex;
      font-family: var(--font-family);
      gap: 0;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .steps__item {
      align-items: center;
      color: var(--color-text-disabled);
      display: grid;
      flex: 1;
      font: var(--mat-sys-body-small);
      font-family: var(--font-family);
      gap: var(--space-half);
      justify-items: center;
      position: relative;
    }

    // Connector to the previous step.
    .steps__item:not(:first-child)::before {
      background: var(--color-divider);
      content: '';
      height: 2px;
      left: calc(-50% + var(--space-3));
      position: absolute;
      right: calc(50% + var(--space-3));
      top: var(--space-2);
    }

    .steps__item--done:not(:first-child)::before,
    .steps__item--current:not(:first-child)::before {
      background: var(--color-success);
    }

    .steps__marker {
      align-items: center;
      background: var(--color-secondary-tint);
      border-radius: var(--radius-pill);
      display: inline-flex;
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
      font-weight: 600;
      height: var(--space-4);
      justify-content: center;
      position: relative;
      transition: background-color var(--duration-base) var(--ease-standard);
      width: var(--space-4);
    }

    .steps__item--done {
      color: var(--color-text);
    }

    .steps__item--done .steps__marker {
      background: var(--color-success);
      color: var(--color-on-success);
    }

    .steps__item--current {
      color: var(--color-text);
    }

    .steps__item--current .steps__marker {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }
  `,
})
export class StepIndicatorComponent {
  readonly steps = input.required<readonly string[]>();
  readonly current = input(0);

  protected readonly checkSize = STEP_CHECK_SIZE;
}
