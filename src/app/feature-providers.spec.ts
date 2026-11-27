import { CATALOG_API } from './modules/catalog/product-list/services/catalog-api';
import { provideCatalogApi } from './modules/catalog/product-list/catalog.config';
import { KITCHEN_API } from './modules/kitchen/kitchen-board/services/kitchen-api';
import { provideKitchenApi } from './modules/kitchen/kitchen-board/kitchen.config';
import { MANAGER_API } from './modules/manager/services/manager-api';
import { provideManagerApi } from './modules/manager/manager.config';
import { PICKUP_API } from './modules/orders/pickup-order/services/pickup-api';
import { providePickupApi } from './modules/orders/pickup-order/pickup.config';
import { ORDERS_API } from './modules/orders/take-order/services/orders-api';
import { provideOrdersApi } from './modules/orders/take-order/orders.config';
import { CATALOG_ROUTES } from './modules/catalog/product-list/catalog.routes';
import { HOME_ROUTES } from './modules/home/home-page/home.routes';
import { KITCHEN_ROUTES } from './modules/kitchen/kitchen-board/kitchen.routes';
import { MANAGER_ROUTES } from './modules/manager/dashboard-page/manager.routes';
import { SYSTEM_ROUTES } from './modules/system/system.routes';
import { TRACKING_ROUTES } from './modules/tracking/tracking-page/tracking.routes';

describe('feature providers', () => {
  it.each([
    ['catalog', provideCatalogApi, CATALOG_API],
    ['kitchen', provideKitchenApi, KITCHEN_API],
    ['manager', provideManagerApi, MANAGER_API],
    ['pickup', providePickupApi, PICKUP_API],
    ['orders', provideOrdersApi, ORDERS_API],
  ] as const)('should provide the %s API', (_name, provide, token) => {
    // Act
    const provider = provide() as { provide: unknown; useClass: unknown };

    // Assert
    expect(provider.provide).toBe(token);
    expect(typeof provider.useClass).toBe('function');
  });
});

describe('feature routes', () => {
  it.each([
    ['catalog', CATALOG_ROUTES],
    ['home', HOME_ROUTES],
    ['kitchen', KITCHEN_ROUTES],
    ['manager', MANAGER_ROUTES],
    ['system', SYSTEM_ROUTES],
    ['tracking', TRACKING_ROUTES],
  ] as const)('should load the page of the %s route', async (_name, routes) => {
    // Act
    const page = await routes[0]?.loadComponent?.();

    // Assert
    expect(typeof page).toBe('function');
  });
});
