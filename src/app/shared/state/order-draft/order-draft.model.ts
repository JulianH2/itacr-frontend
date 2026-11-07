/** An option of a combo the customer chose (size, drink, or an ingredient to leave out). */
export interface ChosenOption {
  readonly id: string;
  readonly name: string;
}

/** An extra of a combo: it also carries what it adds to the unit price. */
export interface ChosenExtra extends ChosenOption {
  readonly price: number;
}

/** What was chosen for a combo (HU_12): the size and the drink are always there, extras and exclusions may be empty. */
export interface ComboCustomization {
  readonly size: ChosenOption;
  readonly drink: ChosenOption;
  readonly extras: readonly ChosenExtra[];
  readonly exclusions: readonly ChosenOption[];
}

/** A line of the order being built, before it is submitted. */
export interface OrderDraftItem {
  /**
   * What makes the line: the product, plus its customization. The same combo with other options is another line, so
   * the quantity and the removal are by line, not by product. For a product with no options it is the product id.
   */
  readonly lineId: string;
  readonly productId: string;
  /** Product name captured when the item was added, so the draft renders without the catalog. */
  readonly name: string;
  /** Price in MXN of a single unit, captured when the item was added. It already includes the size and the extras. */
  readonly unitPrice: number;
  readonly quantity: number;
  /** The options of a combo, or null for any other product. */
  readonly customization: ComboCustomization | null;
}

/** What a caller must provide to add a product to the draft. */
export interface OrderDraftProduct {
  readonly productId: string;
  readonly name: string;
  readonly unitPrice: number;
  readonly customization?: ComboCustomization | null;
}

/** The line a product with these options belongs to. The order of the extras and exclusions does not matter. */
export function lineIdOf(productId: string, customization?: ComboCustomization | null): string {
  if (!customization) {
    return productId;
  }
  const ids = (options: readonly ChosenOption[]): string =>
    options
      .map((option) => option.id)
      .sort()
      .join(',');
  return [
    productId,
    customization.size.id,
    customization.drink.id,
    ids(customization.extras),
    ids(customization.exclusions),
  ].join('|');
}

/** The names chosen for a combo, as the API returns them in the detail of an order. Every part may be missing. */
export interface ChoiceNames {
  readonly size?: string | null;
  readonly drink?: string | null;
  readonly extras?: readonly string[];
  readonly exclusions?: readonly string[];
}

/** What the cook and the customer read for one combo, one text per line: the size, the drink, `+ extra`, `Sin ingrediente`. */
export function choiceLines(choices: ChoiceNames): string[] {
  return [
    ...(choices.size ? [choices.size] : []),
    ...(choices.drink ? [choices.drink] : []),
    ...(choices.extras ?? []).map((extra) => `+ ${extra}`),
    ...(choices.exclusions ?? []).map((exclusion) => `Sin ${exclusion.toLowerCase()}`),
  ];
}

/** The lines of the combo in the draft; none for a product with no options. */
export function customizationLines(customization: ComboCustomization | null | undefined): string[] {
  if (!customization) {
    return [];
  }
  return choiceLines({
    size: customization.size.name,
    drink: customization.drink.name,
    extras: customization.extras.map((extra) => extra.name),
    exclusions: customization.exclusions.map((exclusion) => exclusion.name),
  });
}

/** The line as the API takes it (`POST /orders` and `POST /public/orders`): ids only, the price comes from the menu. */
export function toRequestItem(item: OrderDraftItem): {
  readonly productId: string;
  readonly quantity: number;
  readonly sizeId?: string;
  readonly drinkId?: string;
  readonly extraIds?: readonly string[];
  readonly exclusionIds?: readonly string[];
} {
  const { productId, quantity, customization } = item;
  if (!customization) {
    return { productId, quantity };
  }
  return {
    productId,
    quantity,
    sizeId: customization.size.id,
    drinkId: customization.drink.id,
    extraIds: customization.extras.map((extra) => extra.id),
    exclusionIds: customization.exclusions.map((exclusion) => exclusion.id),
  };
}
