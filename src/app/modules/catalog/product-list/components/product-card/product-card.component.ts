import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { MxnPricePipe } from '@shared/pipes/mxn-price.pipe';
import type { Product } from '../../models/catalog.models';

/** Card with the photo, name, description and price of a product and its "Agregar" button. */
@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MxnPricePipe],
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
        <div class="product-card__image product-card__image--empty" aria-hidden="true"></div>
      }
      <div class="product-card__body">
        <h3 class="product-card__name">{{ product().name }}</h3>
        <p class="product-card__description">{{ product().description }}</p>
        <p class="product-card__price">{{ product().price | mxnPrice }}</p>
      </div>
      <button
        type="button"
        class="product-card__add"
        [attr.aria-label]="'Agregar ' + product().name + ' al pedido'"
        (click)="addRequested.emit(product())"
      >
        Agregar
      </button>
    </article>
  `,
  styles: `
    .product-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
      box-sizing: border-box;
      padding: 16px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container);
      color: var(--mat-sys-on-surface);
    }

    .product-card__image {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 12px;
      object-fit: cover;
      background: var(--mat-sys-surface-container-high);
    }

    .product-card__body {
      flex: 1;
    }

    .product-card__name {
      margin: 0 0 4px;
      font: var(--mat-sys-title-medium);
    }

    .product-card__description {
      margin: 0 0 8px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }

    .product-card__price {
      margin: 0;
      font: var(--mat-sys-title-large);
    }

    .product-card__add {
      min-height: 48px;
      border: 0;
      border-radius: 24px;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      font: var(--mat-sys-label-large);
      cursor: pointer;
    }
  `,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly addRequested = output<Product>();

  protected readonly failedImageUrl = signal<string | null>(null);
  protected readonly imageUrl = computed(() => {
    const imageUrl = this.product().imageUrl;
    return imageUrl !== this.failedImageUrl() ? imageUrl : null;
  });
}
