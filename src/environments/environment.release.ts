import type { AppEnvironment } from './environment.model';

const BACKEND_URL = 'https://app-itacr-backend-release.azurewebsites.net';

export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: `${BACKEND_URL}/api/v1`,
  kitchenHubUrl: `${BACKEND_URL}/hubs/kitchen`,
  vapidPublicKey: '',
  useMockApi: false,
};
