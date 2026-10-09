import type { Provider } from '@angular/core';

import { environment } from '@env/environment';

import { HttpOrdersApiService } from './services/http-orders-api.service';
import { MockOrdersApiService } from './services/mock-orders-api.service';
import { ORDERS_API } from './services/orders-api';

export function provideOrdersApi(): Provider {
  return {
    provide: ORDERS_API,
    useClass: environment.useMockApi ? MockOrdersApiService : HttpOrdersApiService,
  };
}
