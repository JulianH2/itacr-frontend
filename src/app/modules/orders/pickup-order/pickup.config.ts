import type { Provider } from '@angular/core';

import { environment } from '@env/environment';

import { HttpPickupApiService } from './services/http-pickup-api.service';
import { MockPickupApiService } from './services/mock-pickup-api.service';
import { PICKUP_API } from './services/pickup-api';

export function providePickupApi(): Provider {
  return {
    provide: PICKUP_API,
    useClass: environment.useMockApi ? MockPickupApiService : HttpPickupApiService,
  };
}
