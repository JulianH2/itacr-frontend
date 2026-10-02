import type { AppEnvironment } from './environment.model';

/** Local development configuration, pointing to itacr-backend running on port 3000. */
export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
  kitchenHubUrl: 'http://localhost:3000/hubs/kitchen',
  vapidPublicKey: '',
};
