import type { Provider } from '@angular/core';

import { environment } from '@env/environment';

import { CATALOG_API } from './services/catalog-api';
import { HttpCatalogApiService } from './services/http-catalog-api.service';
import { MockCatalogApiService } from './services/mock-catalog-api.service';

export function provideCatalogApi(): Provider {
  return {
    provide: CATALOG_API,
    useClass: environment.useMockApi ? MockCatalogApiService : HttpCatalogApiService,
  };
}
