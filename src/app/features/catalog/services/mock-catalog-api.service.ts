import { Injectable } from '@angular/core';
import { type Observable, delay, of } from 'rxjs';

import type { Category, Product } from '../models/catalog.models';
import type { CatalogApi } from './catalog-api';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from './mock-catalog.data';

const MOCK_LATENCY_MS = 300;

/** In-memory catalog used until `GET /catalog/*` exists in itacr-backend. */
@Injectable()
export class MockCatalogApiService implements CatalogApi {
  getCategories(): Observable<readonly Category[]> {
    return of(MOCK_CATEGORIES).pipe(delay(MOCK_LATENCY_MS));
  }

  getProducts(categoryId: string): Observable<readonly Product[]> {
    const products = MOCK_PRODUCTS.filter((product) => product.categoryId === categoryId);
    return of(products).pipe(delay(MOCK_LATENCY_MS));
  }
}
