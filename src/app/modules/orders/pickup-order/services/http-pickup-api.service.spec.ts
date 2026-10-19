import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '@env/environment';

import type { CreatePickupOrderRequest } from '../models/pickup-order.models';
import { HttpPickupApiService } from './http-pickup-api.service';

describe('HttpPickupApiService', () => {
  let service: HttpPickupApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpPickupApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HttpPickupApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should post the order to the public orders path', () => {
    // Arrange
    const request: CreatePickupOrderRequest = {
      clientOrderId: '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b',
      name: 'Ana María',
      phone: '7711234567',
      items: [{ productId: 'p1', quantity: 2 }],
    };

    // Act
    service.createOrder(request).subscribe();

    // Assert
    const call = http.expectOne(`${environment.apiBaseUrl}/public/orders`);
    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual(request);
    call.flush({});
  });

  it('should ask for the status of a receipt under the public orders path', () => {
    // Act
    service.getOrder('3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b').subscribe();

    // Assert
    const call = http.expectOne(
      `${environment.apiBaseUrl}/public/orders/3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b`,
    );
    expect(call.request.method).toBe('GET');
    call.flush({});
  });

  it('should encode the id so it can never change the path of the request', () => {
    // Act
    service.getOrder('../kitchen/queue').subscribe();

    // Assert
    const call = http.expectOne(`${environment.apiBaseUrl}/public/orders/..%2Fkitchen%2Fqueue`);
    call.flush({});
  });
});
