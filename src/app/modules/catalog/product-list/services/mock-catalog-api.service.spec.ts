import { firstValueFrom } from 'rxjs';

import { MOCK_CATEGORIES, MOCK_COMBO_OPTIONS, MOCK_PRODUCTS } from './mock-catalog.data';
import { MockCatalogApiService } from './mock-catalog-api.service';

describe('MockCatalogApiService', () => {
  let api: MockCatalogApiService;

  beforeEach(() => {
    vi.useFakeTimers();
    api = new MockCatalogApiService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function settle<T>(answer: Promise<T>): Promise<T> {
    await vi.advanceTimersByTimeAsync(1000);
    return answer;
  }

  it('should answer the categories, the products of one category and the combo options', async () => {
    // Arrange
    const category = MOCK_CATEGORIES[0];

    // Act
    const categories = await settle(firstValueFrom(api.getCategories()));
    const products = await settle(firstValueFrom(api.getProducts(category.id)));
    const options = await settle(firstValueFrom(api.getComboOptions()));

    // Assert
    expect(categories).toEqual(MOCK_CATEGORIES);
    expect(products).toEqual(MOCK_PRODUCTS.filter((product) => product.categoryId === category.id));
    expect(options).toEqual(MOCK_COMBO_OPTIONS);
  });
});
