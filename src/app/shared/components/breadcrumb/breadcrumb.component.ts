import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { Breadcrumb } from '@shared/navigation/breadcrumbs';
import { IconComponent } from '../icon/icon.component';

const SEPARATOR_SIZE = 16;

/** Path of the current screen ("Pedidos › Detalle"). The last crumb is the page you are on. */
@Component({
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <nav aria-label="Ruta">
      <ol class="crumbs">
        @for (crumb of crumbs(); track crumb.url; let last = $last) {
          <li class="crumbs__item">
            @if (last) {
              <span class="crumbs__current" aria-current="page">{{ crumb.label }}</span>
            } @else {
              <a class="crumbs__link" [routerLink]="crumb.url">{{ crumb.label }}</a>
              <app-icon class="crumbs__separator" name="chevron-right" [size]="separatorSize" />
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    .crumbs {
      align-items: center;
      display: flex;
      font: var(--mat-sys-body-medium);
      font-family: var(--font-family);
      gap: var(--space-1);
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .crumbs__item {
      align-items: center;
      display: inline-flex;
      gap: var(--space-1);
    }

    .crumbs__link {
      color: var(--color-text-secondary);
      text-decoration: none;
    }

    @media (hover: hover) {
      .crumbs__link:hover {
        color: var(--color-text);
        text-decoration: underline;
        text-underline-offset: 4px;
      }
    }

    .crumbs__separator {
      color: var(--color-text-secondary);
    }

    .crumbs__current {
      color: var(--color-text);
      font-weight: 500;
    }
  `,
})
export class BreadcrumbComponent {
  readonly crumbs = input.required<readonly Breadcrumb[]>();

  protected readonly separatorSize = SEPARATOR_SIZE;
}
