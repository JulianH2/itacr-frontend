import type { Provider } from '@angular/core';

import { environment } from '@env/environment';
import { apiImplementation } from '@shared/config/api-implementation';

import { HttpPickupApiService } from './services/http-pickup-api.service';
import { MockPickupApiService } from './services/mock-pickup-api.service';
import { PICKUP_API } from './services/pickup-api';

export function providePickupApi(): Provider {
  return {
    provide: PICKUP_API,
    useClass: apiImplementation(environment.useMockApi, MockPickupApiService, HttpPickupApiService),
  };
}
