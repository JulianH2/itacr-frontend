import { MOCK_PRODUCTS } from './mock-catalog.data';

/** The files in public/assets/images/products, named after the seeded products (ITACR-48). */
const PHOTO_NAMES = [
  'agua-natural',
  'aros-de-cebolla',
  'brownie-con-helado',
  'combo-clasico',
  'combo-doble',
  'combo-infantil',
  'combo-pollo',
  'hamburguesa-clasica',
  'hamburguesa-con-queso',
  'hamburguesa-de-pollo',
  'hamburguesa-doble',
  'helado-de-vainilla',
  'limonada',
  'nuggets-de-pollo',
  'papas-a-la-francesa',
  'pay-de-manzana',
  'refresco-de-cola',
  'refresco-de-lima-limon',
];

describe('MOCK_PRODUCTS', () => {
  it('should point every product to its own WebP photo, like the seeded catalog', () => {
    // Act
    const urls = MOCK_PRODUCTS.map((product) => product.imageUrl);

    // Assert
    expect(
      urls.every((url) => url?.startsWith('/assets/images/products/') && url.endsWith('.webp')),
    ).toBe(true);
    expect(new Set(urls).size).toBe(MOCK_PRODUCTS.length);
  });

  it('should name each photo after the product without accents, in kebab case', () => {
    // Act
    const names = MOCK_PRODUCTS.map((product) =>
      product.imageUrl?.replace('/assets/images/products/', '').replace('.webp', ''),
    );

    // Assert
    expect([...names].sort()).toEqual(PHOTO_NAMES);
  });
});
