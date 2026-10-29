import type { AppEnvironment } from './environment.model';

const BACKEND_URL = 'https://app-itacr-backend-prod-b3hvcggncghafbgp.westus-01.azurewebsites.net';

export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: `${BACKEND_URL}/api/v1`,
  kitchenHubUrl: `${BACKEND_URL}/hubs/kitchen`,
  useMockApi: false,
};
