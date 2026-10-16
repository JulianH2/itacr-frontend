/** Same id scheme as the catalog seed of itacr-backend: kind 2 = product. */
function productId(number: number): string {
  return `20000000-0000-0000-0000-${String(number).padStart(12, '0')}`;
}

export interface MockMenuProduct {
  readonly name: string;
  readonly price: number;
}

/** The 18 seeded products, so the mock answers with real names and prices. */
export const MOCK_MENU: ReadonlyMap<string, MockMenuProduct> = new Map(
  (
    [
      ['Combo Clásico', 119],
      ['Combo Doble', 149],
      ['Combo Pollo', 129],
      ['Combo Infantil', 89],
      ['Hamburguesa Clásica', 79],
      ['Hamburguesa con Queso', 89],
      ['Hamburguesa Doble', 109],
      ['Hamburguesa de Pollo', 95],
      ['Papas a la Francesa', 39],
      ['Aros de Cebolla', 45],
      ['Nuggets de Pollo', 55],
      ['Refresco de Cola', 29],
      ['Refresco de Lima-Limón', 29],
      ['Agua Natural', 20],
      ['Limonada', 32],
      ['Helado de Vainilla', 35],
      ['Pay de Manzana', 38],
      ['Brownie con Helado', 49],
    ] as const
  ).map(([name, price], index) => [productId(index + 1), { name, price }] as const),
);
