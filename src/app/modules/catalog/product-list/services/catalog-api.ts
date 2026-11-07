import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

import type { Category, ComboOption, Product } from '../models/catalog.models';

/** Read-only access to the restaurant menu. Implemented by the HTTP client and by a mock. */
export interface CatalogApi {
  getCategories(): Observable<readonly Category[]>;
  getProducts(categoryId: string): Observable<readonly Product[]>;
  /** Sizes, drinks, extras, and ingredients to leave out that a combo can be customized with. */
  getComboOptions(): Observable<readonly ComboOption[]>;
}

export const CATALOG_API = new InjectionToken<CatalogApi>('CATALOG_API');
