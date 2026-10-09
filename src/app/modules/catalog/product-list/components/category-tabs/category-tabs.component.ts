import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { Category } from '../../models/catalog.models';

/** Horizontal list of category chips; the selected one is marked with `aria-pressed`. */
@Component({
  selector: 'app-category-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Categorías del menú">
      <ul class="category-tabs">
        @for (category of categories(); track category.id) {
          <li>
            <button
              type="button"
              class="category-tabs__chip"
              [attr.aria-pressed]="category.id === selectedId()"
              (click)="categorySelected.emit(category.id)"
            >
              {{ category.name }}
            </button>
          </li>
        }
      </ul>
    </nav>
  `,
  styles: `
    .category-tabs {
      display: flex;
      gap: 8px;
      margin: 0;
      padding: 0 0 4px;
      overflow-x: auto;
      list-style: none;
    }

    .category-tabs__chip {
      min-width: 44px;
      min-height: 44px;
      padding: 0 20px;
      border: 1px solid var(--mat-sys-outline);
      border-radius: 22px;
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-label-large);
      white-space: nowrap;
      cursor: pointer;
    }

    .category-tabs__chip[aria-pressed='true'] {
      border-color: transparent;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
  `,
})
export class CategoryTabsComponent {
  readonly categories = input.required<readonly Category[]>();
  readonly selectedId = input<string | null>(null);
  readonly categorySelected = output<string>();
}
