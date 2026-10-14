import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { IconComponent } from '@shared/components/icon/icon.component';
import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';
import type { Product } from '../../models/catalog.models';

const PLACEHOLDER_ICON_SIZE = 32;

/** Card with the photo, name, description and price of a product and its round "+" button. */
@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, MxnPricePipe],
  template: `
    <article class="product-card">
      @if (imageUrl(); as imageUrl) {
        <img
          class="product-card__image"
          [src]="imageUrl"
          [alt]="'Foto de ' + product().name"
          width="160"
          height="160"
          loading="lazy"
          (error)="failedImageUrl.set(imageUrl)"
        />
      } @else {
        <div class="product-card__image product-card__image--empty" aria-hidden="true">
          <app-icon name="bag" [size]="placeholderSize" />
        </div>
      }
      <div class="product-card__body">
        <h3 class="product-card__name">{{ product().name }}</h3>
        <p class="product-card__description">{{ product().description }}</p>
      </div>
      <div class="product-card__footer">
        <p class="product-card__price tabular">{{ product().price | mxnPrice }}</p>
        <button
          type="button"
          class="product-card__add"
          [attr.aria-label]="'Agregar ' + product().name + ' al pedido'"
          (click)="addRequested.emit(product())"
        >
          <app-icon name="plus" [size]="22" />
          <span class="sr-only">Agregar</span>
        </button>
      </div>
    </article>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .product-card {
      background: var(--color-surface);
      border: 1px solid var(--color-card-border);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-subtle);
      box-sizing: border-box;
      color: var(--color-text);
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .product-card__image {
      aspect-ratio: 4 / 3;
      background: var(--color-secondary-tint);
      display: block;
      object-fit: cover;
      width: 100%;
    }

    .product-card__image--empty {
      align-items: center;
      color: var(--color-secondary);
      display: flex;
      justify-content: center;
    }

    .product-card__body {
      flex: 1;
      padding: var(--space-2) var(--space-2) 0;
    }

    .product-card__name {
      font: var(--mat-sys-title-medium);
      font-family: var(--font-family);
      margin: 0;
    }

    .product-card__description {
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      color: var(--color-text-secondary);
      display: -webkit-box;
      font: var(--mat-sys-body-small);
      font-family: var(--font-family);
      margin: var(--space-half) 0 0;
      overflow: hidden;
    }

    .product-card__footer {
      align-items: center;
      display: flex;
      justify-content: space-between;
      padding: var(--space-1) var(--space-2) var(--space-2);
    }

    .product-card__price {
      font: var(--mat-sys-title-large);
      font-family: var(--font-family);
      margin: 0;
    }

    .product-card__add {
      align-items: center;
      background: var(--color-primary);
      border: 0;
      border-radius: var(--radius-pill);
      color: var(--color-on-primary);
      cursor: pointer;
      display: inline-flex;
      height: var(--touch-target);
      justify-content: center;
      transition:
        background-color var(--duration-fast) var(--ease-standard),
        transform var(--duration-fast) var(--ease-standard);
      width: var(--touch-target);
    }

    .product-card__add:active {
      background: var(--color-primary-pressed);
      transform: scale(0.92);
    }

    @media (hover: hover) {
      .product-card__add:hover {
        background: var(--color-primary-hover);
      }
    }
  `,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly addRequested = output<Product>();

  protected readonly placeholderSize = PLACEHOLDER_ICON_SIZE;
  protected readonly failedImageUrl = signal<string | null>(null);
  protected readonly imageUrl = computed(() => {
    const imageUrl = this.product().imageUrl;
    return imageUrl !== this.failedImageUrl() ? imageUrl : null;
  });
}
