import type { AppEnvironment } from './environment.model';

/**
 * Production configuration.
 * The API is expected on the same origin (behind a reverse proxy) so that the
 * service worker data groups in ngsw-config.json can cache catalog requests.
 */
export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: '/api/v1',
  socketUrl: '/',
  vapidPublicKey: '',
};
