import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent } from '../icon/icon.component';
import type { IconName } from '../icon/icon-paths';

export type StatePageTone = 'brand' | 'neutral';

const STATE_ICON_SIZE = 56;

/** Full-page notice (404, no connection): a round icon, what happened, what to do. Actions go in the slot. */
@Component({
  selector: 'app-state-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <section class="state">
      <span [class]="'state__icon state__icon--' + tone()">
        <app-icon [name]="icon()" [size]="iconSize" />
      </span>
      @if (eyebrow(); as eyebrow) {
        <p class="state__eyebrow">{{ eyebrow }}</p>
      }
      <h1 class="state__title">{{ heading() }}</h1>
      <p class="state__text">{{ description() }}</p>
      <ng-content select="[state-badge]" />
      <div class="state__actions"><ng-content /></div>
    </section>
  `,
  styles: `
    .state {
      align-content: center;
      display: grid;
      gap: var(--space-1);
      justify-items: center;
      margin: 0 auto;
      max-width: 480px;
      min-height: 60dvh;
      padding: var(--space-5) var(--space-2);
      text-align: center;
    }

    .state__icon {
      align-items: center;
      animation: state-in var(--duration-slow) var(--ease-standard) both;
      border-radius: var(--radius-pill);
      display: inline-flex;
      height: 104px;
      justify-content: center;
      margin-bottom: var(--space-2);
      width: 104px;
    }

    .state__icon--brand {
      background: var(--color-bg-deep);
      color: var(--color-primary);
    }

    .state__icon--neutral {
      background: var(--color-secondary-tint);
      color: var(--color-secondary-strong);
    }

    .state__eyebrow {
      color: var(--color-primary);
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
      font-weight: 600;
      margin: 0;
    }

    .state__title {
      font: var(--mat-sys-headline-large);
      font-family: var(--font-family);
      margin: 0;
    }

    .state__text {
      color: var(--color-text-secondary);
      font: var(--mat-sys-body-large);
      font-family: var(--font-family);
      margin: 0 0 var(--space-1);
      max-width: 40ch;
    }

    .state__actions {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      justify-content: center;
      margin-top: var(--space-1);
    }

    @keyframes state-in {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
    }
  `,
})
export class StatePageComponent {
  readonly icon = input.required<IconName>();
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
  readonly eyebrow = input('');
  readonly tone = input<StatePageTone>('brand');

  protected readonly iconSize = STATE_ICON_SIZE;
}
