import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { environment } from '@env/environment';

import type { Category, Product } from '../models/catalog.models';
import type { CatalogApi } from './catalog-api';

/**
 * Catalog client for itacr-backend. Every URL starts with `environment.apiBaseUrl` followed by
 * `/catalog`, which is the pattern the service worker data group in ngsw-config.json caches.
 */
@Injectable()
export class HttpCatalogApiService implements CatalogApi {
  private readonly http = inject(HttpClient);
  private readonly catalogUrl = `${environment.apiBaseUrl}/catalog`;

  getCategories(): Observable<readonly Category[]> {
    return this.http.get<readonly Category[]>(`${this.catalogUrl}/categories`);
  }

  getProducts(categoryId: string): Observable<readonly Product[]> {
    const params = new HttpParams().set('categoryId', categoryId);
    return this.http.get<readonly Product[]>(`${this.catalogUrl}/products`, { params });
  }
}
