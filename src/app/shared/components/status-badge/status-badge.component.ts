import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent } from '../icon/icon.component';
import type { IconName } from '../icon/icon-paths';

export type BadgeTone = 'success' | 'neutral' | 'brand' | 'outline-success' | 'pending' | 'warning';

const BADGE_ICON_SIZE = 16;

/** Status pill ("En línea", "Pendiente", "Con retraso"...). The tone carries the meaning, never the color alone. */
@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <span class="badge" [class]="'badge badge--' + tone()">
      @if (icon(); as icon) {
        <app-icon [name]="icon" [size]="iconSize" />
      }
      <ng-content />
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .badge {
      align-items: center;
      border: 1px solid transparent;
      border-radius: var(--radius-pill);
      display: inline-flex;
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
      font-weight: 600;
      gap: var(--space-half);
      line-height: 1;
      padding: var(--space-1) var(--space-1-5);
      white-space: nowrap;
    }

    .badge--success {
      background: var(--color-success-tint);
      color: var(--color-success-strong);
    }

    .badge--neutral {
      background: var(--color-secondary-tint);
      color: var(--color-secondary-strong);
    }

    .badge--brand {
      background: var(--color-primary-tint);
      color: var(--color-primary);
    }

    .badge--outline-success {
      border-color: var(--color-success);
      color: var(--color-success-strong);
    }

    .badge--pending {
      background: var(--color-bg-deep);
      color: var(--color-text);
    }

    .badge--warning {
      background: var(--color-warning-tint);
      color: var(--color-warning-text);
    }
  `,
})
export class StatusBadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
  readonly icon = input<IconName | null>(null);

  protected readonly iconSize = BADGE_ICON_SIZE;
}
