import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '@env/environment';

import { HttpCatalogApiService } from './http-catalog-api.service';
import { MOCK_CATEGORIES } from './mock-catalog.data';

describe('HttpCatalogApiService', () => {
  let service: HttpCatalogApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpCatalogApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HttpCatalogApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // CA4: the service worker data group only caches URLs under <apiBaseUrl>/catalog/**.
  it('should request categories under the catalog path of the API base URL', () => {
    // Act
    let received: unknown;
    service.getCategories().subscribe((categories) => (received = categories));

    // Assert
    const request = http.expectOne(`${environment.apiBaseUrl}/catalog/categories`);
    request.flush(MOCK_CATEGORIES);
    expect(received).toEqual(MOCK_CATEGORIES);
  });

  it('should request products filtered by categoryId under the catalog path', () => {
    // Act
    service.getProducts('cat-combos').subscribe();

    // Assert
    const request = http.expectOne(
      `${environment.apiBaseUrl}/catalog/products?categoryId=cat-combos`,
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
