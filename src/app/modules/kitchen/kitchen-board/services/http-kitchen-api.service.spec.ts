import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '@env/environment';

import type { KitchenQueue } from '../models/kitchen.models';
import { HttpKitchenApiService } from './http-kitchen-api.service';
import { mockKitchenQueue } from './mock-kitchen.data';

describe('HttpKitchenApiService', () => {
  let service: HttpKitchenApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpKitchenApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HttpKitchenApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should request the queue under the kitchen path of the API base URL', () => {
    // Arrange
    const queue = mockKitchenQueue(Date.now(), 1);

    // Act
    let received: KitchenQueue | undefined;
    service.getQueue().subscribe((result) => (received = result));

    // Assert
    const request = http.expectOne(`${environment.apiBaseUrl}/kitchen/queue`);
    expect(request.request.method).toBe('GET');
    request.flush(queue);
    expect(received).toEqual(queue);
  });
});
