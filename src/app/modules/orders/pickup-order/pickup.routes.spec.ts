import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PICKUP_ROUTES } from './pickup.routes';

describe('PICKUP_ROUTES', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('should load the page of every path of the customer', async () => {
    const children = (PICKUP_ROUTES[0].children ?? []).filter(
      (route) => route.loadComponent !== undefined,
    );

    for (const route of children) {
      // Act
      const component = await route.loadComponent?.();

      // Assert
      expect(component).toBeDefined();
    }
  });

  it('should send the customer to the summary when they open the pickup flow', () => {
    // Arrange
    const root = PICKUP_ROUTES[0].children?.[0];

    // Assert
    expect(root?.path).toBe('');
    expect(root?.redirectTo).toBe('summary');
  });

  it('should not guard the pickup flow, because the customer has no session', () => {
    // Assert
    expect(PICKUP_ROUTES[0].canActivate).toBeUndefined();
  });
});
