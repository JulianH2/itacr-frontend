import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { OrderEditStore } from './services/order-edit-store.service';
import { TakeOrderStore } from './services/take-order-store.service';

import { ORDERS_ROUTES } from './orders.routes';

describe('ORDERS_ROUTES', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('should load the page of every path of the waiter', async () => {
    const children = ORDERS_ROUTES[0].children ?? [];

    for (const route of children) {
      // Act
      const component = await route.loadComponent?.();

      // Assert
      expect(component).toBeDefined();
    }
  });

  it('should provide the stores of the waiter to the pages of the order', () => {
    // Assert
    expect(ORDERS_ROUTES[0].providers).toEqual([TakeOrderStore, OrderEditStore]);
  });

  it('should title every path of the waiter', () => {
    // Arrange
    const children = ORDERS_ROUTES[0].children ?? [];

    // Assert
    expect(children.every((route) => route.title !== undefined)).toBe(true);
  });
});
