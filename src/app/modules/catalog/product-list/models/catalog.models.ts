/** Menu category, as returned by `GET /catalog/categories`. */
export interface Category {
  readonly id: string;
  readonly name: string;
  /** Ascending display order. */
  readonly sortOrder: number;
}

/** Menu product, as returned by `GET /catalog/products?categoryId={id}`. */
export interface Product {
  readonly id: string;
  /** Every product belongs to exactly one category. */
  readonly categoryId: string;
  readonly name: string;
  readonly description: string;
  /** Unit price in MXN. */
  readonly price: number;
  /** Image path (e.g. `/assets/images/products/combo-clasico.png`) or URL; null when there is no photo. */
  readonly imageUrl: string | null;
  readonly isCombo: boolean;
}
