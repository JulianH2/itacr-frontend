import type {
  ChosenExtra,
  ChosenOption,
  ComboCustomization,
} from '@shared/state/order-draft/order-draft.model';

import type { ComboOption, ComboOptionType } from './catalog.models';

/** What the user picked so far in the guided flow; the size and the drink are still missing at the start. */
export interface ComboChoice {
  readonly sizeId: string | null;
  readonly drinkId: string | null;
  readonly extraIds: readonly string[];
  readonly exclusionIds: readonly string[];
}

export const NO_CHOICE: ComboChoice = {
  sizeId: null,
  drinkId: null,
  extraIds: [],
  exclusionIds: [],
};

/** Shown when the user tries to continue without a size (HU_12 CA2). */
export const SIZE_REQUIRED_MESSAGE = 'Selecciona el tamaño para continuar.';
export const DRINK_REQUIRED_MESSAGE = 'Selecciona la bebida para continuar.';

const CENTS_PER_UNIT = 100;

export function optionsOfType(
  options: readonly ComboOption[],
  type: ComboOptionType,
): readonly ComboOption[] {
  return options.filter((option) => option.type === type);
}

function find(options: readonly ComboOption[], id: string | null): ComboOption | undefined {
  return id === null ? undefined : options.find((option) => option.id === id);
}

/**
 * Price of one unit: the price of the combo plus the size plus each extra, the same rule the API applies. The drink and
 * the exclusions never change it. Summed in cents to avoid floating point drift.
 */
export function comboUnitPrice(
  basePrice: number,
  options: readonly ComboOption[],
  choice: ComboChoice,
): number {
  const adjustments = [
    find(options, choice.sizeId)?.priceAdjustment ?? 0,
    ...choice.extraIds.map((id) => find(options, id)?.priceAdjustment ?? 0),
  ];
  const cents = adjustments.reduce(
    (total, adjustment) => total + Math.round(adjustment * CENTS_PER_UNIT),
    Math.round(basePrice * CENTS_PER_UNIT),
  );
  return cents / CENTS_PER_UNIT;
}

function chosen(option: ComboOption): ChosenOption {
  return { id: option.id, name: option.name };
}

/** The choices as the draft keeps them, or null while the size or the drink is missing. */
export function toCustomization(
  options: readonly ComboOption[],
  choice: ComboChoice,
): ComboCustomization | null {
  const size = find(options, choice.sizeId);
  const drink = find(options, choice.drinkId);
  if (size === undefined || drink === undefined) {
    return null;
  }
  const extras: ChosenExtra[] = [];
  for (const id of choice.extraIds) {
    const extra = find(options, id);
    if (extra !== undefined) {
      extras.push({ ...chosen(extra), price: extra.priceAdjustment });
    }
  }
  const exclusions: ChosenOption[] = [];
  for (const id of choice.exclusionIds) {
    const exclusion = find(options, id);
    if (exclusion !== undefined) {
      exclusions.push(chosen(exclusion));
    }
  }
  return { size: chosen(size), drink: chosen(drink), extras, exclusions };
}
