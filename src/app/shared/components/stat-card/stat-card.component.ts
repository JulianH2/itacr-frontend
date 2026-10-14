import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent } from '../icon/icon.component';
import type { IconName } from '../icon/icon-paths';

export type StatTone = 'neutral' | 'success';

const STAT_ICON_SIZE = 20;

/** Metric tile: label, icon chip, one big number and a short caption ("Activos / 5 / En cocina o en mesa"). */
@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <article class="stat">
      <header class="stat__head">
        <h3 class="stat__label">{{ label() }}</h3>
        <span [class]="'stat__chip stat__chip--' + tone()">
          <app-icon [name]="icon()" [size]="iconSize" />
        </span>
      </header>
      <p class="stat__value tabular">{{ value() }}</p>
      @if (caption(); as caption) {
        <p class="stat__caption">{{ caption }}</p>
      }
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .stat {
      background: var(--color-surface);
      border: 1px solid var(--color-card-border);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-subtle);
      display: grid;
      gap: var(--space-half);
      height: 100%;
      padding: var(--space-2);
    }

    .stat__head {
      align-items: center;
      display: flex;
      justify-content: space-between;
    }

    .stat__label {
      color: var(--color-text-secondary);
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
      margin: 0;
    }

    .stat__chip {
      align-items: center;
      background: var(--color-primary-tint);
      border-radius: var(--radius-control);
      color: var(--color-primary);
      display: inline-flex;
      height: var(--space-4);
      justify-content: center;
      width: var(--space-4);
    }

    .stat__chip--success {
      background: var(--color-success-tint);
      color: var(--color-success-strong);
    }

    .stat__value {
      font: var(--mat-sys-display-small);
      font-family: var(--font-family);
      margin: 0;
    }

    .stat__caption {
      color: var(--color-text-secondary);
      font: var(--mat-sys-body-small);
      font-family: var(--font-family);
      margin: 0;
    }
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input.required<IconName>();
  readonly caption = input('');
  readonly tone = input<StatTone>('neutral');

  protected readonly iconSize = STAT_ICON_SIZE;
}
