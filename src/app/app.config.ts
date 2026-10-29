import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { environment } from '@env/environment';
import { authInterceptor } from '@shared/interceptors/auth.interceptor';
import { mockAuthInterceptor } from '@shared/mocks/mock-auth.interceptor';
import { AppUpdateService } from '@shared/services/app-update.service';
import { NotificationReadService } from '@shared/services/notification-read.service';

import { routes } from './app.routes';
import { provideOrdersApi } from './modules/orders/take-order/orders.config';
import { OfflineOrdersService } from './modules/orders/take-order/services/offline-orders.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions({ skipInitialTransition: true }),
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, ...(environment.useMockApi ? [mockAuthInterceptor] : [])]),
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAppInitializer(() => inject(AppUpdateService).start()),
    provideAppInitializer(() => inject(NotificationReadService).start()),
    // Orders saved offline are sent from any screen, so the queue and its API live in root (HU_07).
    provideOrdersApi(),
    provideAppInitializer(() => {
      void inject(OfflineOrdersService).start();
    }),
  ],
};
