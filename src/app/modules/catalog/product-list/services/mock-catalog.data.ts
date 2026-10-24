import type { Category, Product } from '../models/catalog.models';

/** The photo of a product: `/assets/images/products/<name without accents, in kebab case>.webp`, as in the backend seed. */
function toPhotoUrl(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `/assets/images/products/${slug}.webp`;
}

/** Same id scheme as CatalogSeedData in itacr-backend: kind 1 = category, kind 2 = product. */
function seedId(kind: number, number: number): string {
  return `${kind}0000000-0000-0000-0000-${String(number).padStart(12, '0')}`;
}

function category(number: number, name: string): Category {
  return { id: seedId(1, number), name, sortOrder: number };
}

function product(
  number: number,
  categoryNumber: number,
  name: string,
  description: string,
  price: number,
  isCombo = false,
): Product {
  return {
    id: seedId(2, number),
    categoryId: seedId(1, categoryNumber),
    name,
    description,
    price,
    imageUrl: toPhotoUrl(name),
    isCombo,
  };
}

/** Mirrors the categories seeded by itacr-backend (ITACR-28). */
export const MOCK_CATEGORIES: readonly Category[] = [
  category(1, 'Combos'),
  category(2, 'Hamburguesas'),
  category(3, 'Complementos'),
  category(4, 'Bebidas'),
  category(5, 'Postres'),
];

/** Mirrors the products seeded by itacr-backend (ITACR-28). */
export const MOCK_PRODUCTS: readonly Product[] = [
  product(1, 1, 'Combo Clásico', 'Hamburguesa clásica, papas a la francesa y refresco.', 119, true),
  product(
    2,
    1,
    'Combo Doble',
    'Hamburguesa doble carne, papas a la francesa y refresco.',
    149,
    true,
  ),
  product(
    3,
    1,
    'Combo Pollo',
    'Hamburguesa de pollo crujiente, papas a la francesa y refresco.',
    129,
    true,
  ),
  product(4, 1, 'Combo Infantil', 'Mini hamburguesa, papas a la francesa y jugo.', 89, true),

  product(5, 2, 'Hamburguesa Clásica', 'Carne de res, lechuga, jitomate y cebolla.', 79),
  product(6, 2, 'Hamburguesa con Queso', 'Carne de res, queso americano y aderezo de la casa.', 89),
  product(7, 2, 'Hamburguesa Doble', 'Doble carne de res con doble queso.', 109),
  product(8, 2, 'Hamburguesa de Pollo', 'Pechuga de pollo empanizada con lechuga y mayonesa.', 95),

  product(9, 3, 'Papas a la Francesa', 'Porción de papas fritas con sal.', 39),
  product(10, 3, 'Aros de Cebolla', 'Aros de cebolla empanizados y crujientes.', 45),
  product(11, 3, 'Nuggets de Pollo', 'Seis piezas de nuggets con salsa a elegir.', 55),

  product(12, 4, 'Refresco de Cola', 'Refresco de cola de 355 ml.', 29),
  product(13, 4, 'Refresco de Lima-Limón', 'Refresco de lima-limón de 355 ml.', 29),
  product(14, 4, 'Agua Natural', 'Botella de agua natural de 600 ml.', 20),
  product(15, 4, 'Limonada', 'Limonada natural preparada al momento.', 32),

  product(16, 5, 'Helado de Vainilla', 'Copa de helado de vainilla.', 35),
  product(17, 5, 'Pay de Manzana', 'Pay caliente de manzana con canela.', 38),
  product(18, 5, 'Brownie con Helado', 'Brownie de chocolate con una bola de helado.', 49),
];
