import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { OrderDraftService } from '@shared/state/order-draft/order-draft.service';

import type { Category } from '../../models/catalog.models';
import { CATALOG_API, type CatalogApi } from '../../services/catalog-api';
import { CatalogStore } from '../../services/catalog-store.service';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../../services/mock-catalog.data';
import { CatalogPageComponent } from './catalog-page.component';

const EMPTY_CATEGORY: Category = { id: 'cat-promos', name: 'Promociones', sortOrder: 6 };
const EMPTY_CATEGORY_MESSAGE = 'No hay productos en esta categoría.';

/** Synchronous catalog with the seed data plus one category without products (test-only). */
function createFakeApi(): CatalogApi {
  return {
    getCategories: () => of([...MOCK_CATEGORIES, EMPTY_CATEGORY]),
    getProducts: (categoryId) =>
      of(MOCK_PRODUCTS.filter((product) => product.categoryId === categoryId)),
  };
}

async function renderPage(api: CatalogApi): Promise<ComponentFixture<CatalogPageComponent>> {
  await TestBed.configureTestingModule({ imports: [CatalogPageComponent] })
    .overrideComponent(CatalogPageComponent, {
      set: { providers: [{ provide: CATALOG_API, useValue: api }, CatalogStore] },
    })
    .compileComponents();
  const fixture = TestBed.createComponent(CatalogPageComponent);
  await settle(fixture);
  return fixture;
}

/** Categories load first and products second, so the page needs two stable rounds. */
async function settle(fixture: ComponentFixture<CatalogPageComponent>): Promise<void> {
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
}

async function clickButton(
  fixture: ComponentFixture<CatalogPageComponent>,
  text: string,
): Promise<void> {
  const buttons = Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
  );
  const button = buttons.find((candidate) => candidate.textContent?.trim() === text);
  if (!button) {
    throw new Error(`Button "${text}" not found`);
  }
  button.click();
  await settle(fixture);
}

function productNames(fixture: ComponentFixture<CatalogPageComponent>): string[] {
  const names = (fixture.nativeElement as HTMLElement).querySelectorAll('.product-card__name');
  return Array.from(names, (name) => name.textContent?.trim() ?? '');
}

function counterText(fixture: ComponentFixture<CatalogPageComponent>): string {
  const count = (fixture.nativeElement as HTMLElement).querySelector('.order-counter__count');
  return count?.textContent?.trim() ?? '';
}

describe('CatalogPageComponent', () => {
  it('should show only the products of the Combos category when the user taps Combos (CA1)', async () => {
    // Arrange
    const fixture = await renderPage(createFakeApi());
    await clickButton(fixture, 'Bebidas');

    // Act
    await clickButton(fixture, 'Combos');

    // Assert
    const expected = MOCK_PRODUCTS.filter((product) => product.isCombo).map(
      (product) => product.name,
    );
    expect(productNames(fixture)).toEqual(expected);
  });

  it('should increase the order counter and add the product to the draft when the user taps Agregar (CA2)', async () => {
    // Arrange
    const fixture = await renderPage(createFakeApi());
    const orderDraft = TestBed.inject(OrderDraftService);
    expect(counterText(fixture)).toBe('0');

    // Act
    await clickButton(fixture, 'Agregar');

    // Assert
    expect(counterText(fixture)).toBe('1');
    expect(orderDraft.items()).toEqual([
      {
        productId: '20000000-0000-0000-0000-000000000001',
        name: 'Combo Clásico',
        unitPrice: 119,
        quantity: 1,
      },
    ]);
  });

  it('should show the empty message when the selected category has no products (CA3)', async () => {
    // Arrange
    const fixture = await renderPage(createFakeApi());

    // Act
    await clickButton(fixture, EMPTY_CATEGORY.name);

    // Assert
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(EMPTY_CATEGORY_MESSAGE);
    expect(productNames(fixture)).toEqual([]);
  });

  it('should keep adding products when the connection drops after the catalog loaded (CA4)', async () => {
    // Arrange: the catalog is on screen, then every request fails like it would offline.
    const api = createFakeApi();
    const fixture = await renderPage(api);
    api.getProducts = () => throwError(() => new Error('offline'));
    const orderDraft = TestBed.inject(OrderDraftService);

    // Act
    await clickButton(fixture, 'Agregar');
    await clickButton(fixture, 'Agregar');

    // Assert
    expect(productNames(fixture).length).toBeGreaterThan(0);
    expect(counterText(fixture)).toBe('2');
    expect(orderDraft.itemCount()).toBe(2);
  });

  it('should show a Spanish error message with a retry button when the categories fail to load', async () => {
    // Arrange
    const api: CatalogApi = {
      getCategories: () => throwError(() => new Error('network')),
      getProducts: () => of([]),
    };

    // Act
    const fixture = await renderPage(api);

    // Assert
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No pudimos cargar el menú.');
    expect(text).toContain('Reintentar');
  });
});
