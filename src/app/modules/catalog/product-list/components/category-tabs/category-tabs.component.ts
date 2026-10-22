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
      gap: var(--space-1);
      list-style: none;
      margin: 0;
      overflow-x: auto;
      padding: 0 0 var(--space-half);
      scrollbar-width: none;
    }

    .category-tabs__chip {
      background: var(--color-bg-alt);
      border: 0;
      border-radius: var(--radius-pill);
      color: var(--color-text-secondary);
      cursor: pointer;
      font: var(--mat-sys-label-large);
      font-family: var(--font-family);
      font-weight: 600;
      min-height: var(--touch-target);
      min-width: var(--touch-target);
      padding: 0 20px;
      transition:
        background-color var(--duration-base) var(--ease-standard),
        color var(--duration-base) var(--ease-standard),
        transform var(--duration-fast) var(--ease-standard);
      white-space: nowrap;
    }

    .category-tabs__chip:active {
      transform: scale(0.97);
    }

    .category-tabs__chip[aria-pressed='true'] {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    @media (hover: hover) {
      .category-tabs__chip[aria-pressed='false']:hover {
        background: var(--color-primary-tint);
        color: var(--color-text);
      }
    }
  `,
})
export class CategoryTabsComponent {
  readonly categories = input.required<readonly Category[]>();
  readonly selectedId = input<string | null>(null);
  readonly categorySelected = output<string>();
}
