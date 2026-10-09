import { InjectionToken, type Provider } from '@angular/core';

import { environment } from '@env/environment';

import { DEFAULT_TIMER_THRESHOLDS, type TimerThresholds } from './models/kitchen-timer';
import { KITCHEN_API } from './services/kitchen-api';
import { HttpKitchenApiService } from './services/http-kitchen-api.service';
import { MockKitchenApiService } from './services/mock-kitchen-api.service';

/** Where the timer turns yellow and red. Provide another value to adjust it. */
export const KITCHEN_TIMER_THRESHOLDS = new InjectionToken<TimerThresholds>(
  'KITCHEN_TIMER_THRESHOLDS',
  { providedIn: 'root', factory: () => DEFAULT_TIMER_THRESHOLDS },
);

export function provideKitchenApi(): Provider {
  return {
    provide: KITCHEN_API,
    useClass: environment.useMockApi ? MockKitchenApiService : HttpKitchenApiService,
  };
}
