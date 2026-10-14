import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent } from '../icon/icon.component';
import type { IconName } from '../icon/icon-paths';

const EMPTY_STATE_ICON_SIZE = 48;

/** Never a blank space without an explanation: an outline icon, what is missing and what to do next. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <section class="empty">
      <app-icon class="empty__icon" [name]="icon()" [size]="iconSize" />
      <h2 class="empty__title">{{ heading() }}</h2>
      <p class="empty__text">{{ description() }}</p>
      <div class="empty__actions"><ng-content /></div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .empty {
      align-items: center;
      background: var(--color-surface);
      border: 1px solid var(--color-divider);
      border-radius: var(--radius-card);
      display: grid;
      gap: var(--space-1);
      justify-items: center;
      margin: 0 auto;
      max-width: 400px;
      padding: var(--space-4) var(--space-3);
      text-align: center;
    }

    .empty__icon {
      color: var(--color-secondary);
      margin-bottom: var(--space-1);
    }

    .empty__title {
      font: var(--mat-sys-title-large);
      font-family: var(--font-family);
      margin: 0;
    }

    .empty__text {
      color: var(--color-text-secondary);
      font: var(--mat-sys-body-medium);
      font-family: var(--font-family);
      margin: 0;
      max-width: 36ch;
    }

    .empty__actions:empty {
      display: none;
    }

    .empty__actions {
      margin-top: var(--space-1);
    }
  `,
})
export class EmptyStateComponent {
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
  readonly icon = input<IconName>('bag');

  protected readonly iconSize = EMPTY_STATE_ICON_SIZE;
}
