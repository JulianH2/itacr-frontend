import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Product } from '../../models/catalog.models';
import { ProductCardComponent } from './product-card.component';

const PRODUCT: Product = {
  id: 'product-1',
  categoryId: 'category-1',
  name: 'Combo Clásico',
  description: 'Hamburguesa, papas y refresco.',
  price: 119,
  imageUrl: '/assets/images/products/combo-clasico.webp',
  isCombo: true,
};

describe('ProductCardComponent', () => {
  let fixture: ComponentFixture<ProductCardComponent>;

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  async function render(product: Product): Promise<void> {
    fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('product', product);
    await fixture.whenStable();
  }

  it('should show the product photo when the product has an image', async () => {
    // Act
    await render(PRODUCT);

    // Assert
    expect(element().querySelector('img')?.getAttribute('src')).toBe(PRODUCT.imageUrl);
    expect(element().querySelector('.product-card__image--empty')).toBeNull();
  });

  it('should show the empty image placeholder when the photo fails to load', async () => {
    // Arrange
    await render(PRODUCT);

    // Act
    element().querySelector('img')?.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    // Assert
    expect(element().querySelector('img')).toBeNull();
    expect(element().querySelector('.product-card__image--empty')).not.toBeNull();
  });

  it('should show the empty image placeholder when the product has no image', async () => {
    // Act
    await render({ ...PRODUCT, imageUrl: null });

    // Assert
    expect(element().querySelector('img')).toBeNull();
    expect(element().querySelector('.product-card__image--empty')).not.toBeNull();
  });
});
