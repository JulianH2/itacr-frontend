import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '@env/environment';

import type { CreateOrderRequest } from '../models/take-order.models';
import { HttpOrdersApiService } from './http-orders-api.service';

describe('HttpOrdersApiService', () => {
  let service: HttpOrdersApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpOrdersApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HttpOrdersApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should request the dining tables from the API', () => {
    // Act
    service.getDiningTables().subscribe();

    // Assert
    const request = http.expectOne(`${environment.apiBaseUrl}/dining-tables`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('should post the order without prices to the orders endpoint', () => {
    // Arrange
    const order: CreateOrderRequest = {
      clientOrderId: 'client-1',
      tableId: 'table-5',
      takeAway: false,
      items: [{ productId: 'burger', quantity: 2 }],
    };

    // Act
    service.createOrder(order).subscribe();

    // Assert
    const request = http.expectOne(`${environment.apiBaseUrl}/orders`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(order);
    request.flush({});
  });

  it('should request the detail of an order by its id', () => {
    // Act
    service.getOrder('order-1').subscribe();

    // Assert
    const request = http.expectOne(`${environment.apiBaseUrl}/orders/order-1`);
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('should request the recent orders of the waiter', () => {
    // Act
    service.getRecentOrders().subscribe();

    // Assert
    const request = http.expectOne(`${environment.apiBaseUrl}/orders/recent`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
