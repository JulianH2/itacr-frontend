import type { Provider } from '@angular/core';

import { environment } from '@env/environment';

import { MANAGER_API } from './services/manager-api';
import { HttpManagerApiService } from './services/http-manager-api.service';
import { MockManagerApiService } from './services/mock-manager-api.service';

export function provideManagerApi(): Provider {
  return {
    provide: MANAGER_API,
    useClass: environment.useMockApi ? MockManagerApiService : HttpManagerApiService,
  };
}
