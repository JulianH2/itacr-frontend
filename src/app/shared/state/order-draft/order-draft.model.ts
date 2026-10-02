/** A line of the order being built, before it is submitted. */
export interface OrderDraftItem {
  readonly productId: string;
  /** Product name captured when the item was added, so the draft renders without the catalog. */
  readonly name: string;
  /** Price in MXN of a single unit, captured when the item was added. */
  readonly unitPrice: number;
  readonly quantity: number;
}

/** What a caller must provide to add a product to the draft. */
export type OrderDraftProduct = Pick<OrderDraftItem, 'productId' | 'name' | 'unitPrice'>;
