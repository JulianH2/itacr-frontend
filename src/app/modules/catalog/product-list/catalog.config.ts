import type { Provider } from '@angular/core';

import { environment } from '@env/environment';
import { apiImplementation } from '@shared/config/api-implementation';

import { CATALOG_API } from './services/catalog-api';
import { HttpCatalogApiService } from './services/http-catalog-api.service';
import { MockCatalogApiService } from './services/mock-catalog-api.service';

export function provideCatalogApi(): Provider {
  return {
    provide: CATALOG_API,
    useClass: apiImplementation(
      environment.useMockApi,
      MockCatalogApiService,
      HttpCatalogApiService,
    ),
  };
}
