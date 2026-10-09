import { Injectable, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs';

import type { Category, Product } from '../models/catalog.models';
import { CATALOG_API } from './catalog-api';

const NO_PRODUCTS: readonly Product[] = [];
const NO_CATEGORIES: readonly Category[] = [];

/**
 * State of the catalog page: the categories, the selected one and its products.
 * Provided by the page (not root) so every visit starts from the first category.
 */
@Injectable()
export class CatalogStore {
  private readonly api = inject(CATALOG_API);
  private readonly selectedCategoryId = signal<string | null>(null);

  private readonly categoriesResource = rxResource({
    stream: () =>
      this.api.getCategories().pipe(
        tap({ error: (error: unknown) => console.error('Failed to load categories', error) }),
        map((categories) => [...categories].sort((a, b) => a.sortOrder - b.sortOrder)),
      ),
  });

  readonly categories = computed(() => this.categoriesResource.value() ?? NO_CATEGORIES);

  /** The user's selection, or the first category until they pick one. */
  readonly activeCategoryId = computed(
    () => this.selectedCategoryId() ?? this.categories()[0]?.id ?? null,
  );

  private readonly productsResource = rxResource({
    params: () => this.activeCategoryId() ?? undefined,
    stream: ({ params: categoryId }) =>
      this.api.getProducts(categoryId).pipe(
        tap({
          error: (error: unknown) =>
            console.error(`Failed to load products of category ${categoryId}`, error),
        }),
      ),
  });

  readonly products = computed(() => this.productsResource.value() ?? NO_PRODUCTS);

  readonly isLoadingCategories = this.categoriesResource.isLoading;
  readonly hasCategoriesError = computed(() => this.categoriesResource.error() !== undefined);
  readonly isLoadingProducts = this.productsResource.isLoading;
  readonly hasProductsError = computed(() => this.productsResource.error() !== undefined);

  selectCategory(categoryId: string): void {
    this.selectedCategoryId.set(categoryId);
  }

  reloadCategories(): void {
    this.categoriesResource.reload();
  }

  reloadProducts(): void {
    this.productsResource.reload();
  }
}
