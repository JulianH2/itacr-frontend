import type { Provider } from '@angular/core';

import { CATALOG_API } from './services/catalog-api';
import { HttpCatalogApiService } from './services/http-catalog-api.service';
import { MockCatalogApiService } from './services/mock-catalog-api.service';

/**
 * Serves the catalog from in-memory mock data instead of the backend.
 * TODO(ITACR-8): replace with an `environment.useMockCatalog` flag and set it to false once
 * `GET /api/v1/catalog/*` is deployed (environment files are outside this branch's scope).
 */
export const USE_MOCK_CATALOG = true;

/** Binds the CatalogApi token to the mock or to the HTTP implementation. */
export function provideCatalogApi(): Provider {
  return {
    provide: CATALOG_API,
    useClass: USE_MOCK_CATALOG ? MockCatalogApiService : HttpCatalogApiService,
  };
}
