import {
  type ComboCustomization,
  type OrderDraftItem,
  choiceLines,
  customizationLines,
  lineIdOf,
  toRequestItem,
} from './order-draft.model';

const CUSTOMIZATION: ComboCustomization = {
  size: { id: 'size-large', name: 'Grande' },
  drink: { id: 'drink-cola', name: 'Refresco de cola' },
  extras: [
    { id: 'extra-cheese', name: 'Queso extra', price: 12 },
    { id: 'extra-bacon', name: 'Tocino', price: 18 },
  ],
  exclusions: [{ id: 'no-onion', name: 'Cebolla' }],
};

describe('order draft model', () => {
  describe('lineIdOf', () => {
    it('should be the product id when the product has no options', () => {
      expect(lineIdOf('burger')).toBe('burger');
      expect(lineIdOf('burger', null)).toBe('burger');
    });

    it('should not depend on the order of the extras and the exclusions', () => {
      // Arrange
      const reversed: ComboCustomization = {
        ...CUSTOMIZATION,
        extras: [...CUSTOMIZATION.extras].reverse(),
      };

      // Assert
      expect(lineIdOf('combo', reversed)).toBe(lineIdOf('combo', CUSTOMIZATION));
    });

    it('should differ when any option differs', () => {
      // Arrange
      const withoutOnion = lineIdOf('combo', CUSTOMIZATION);

      // Assert
      expect(lineIdOf('combo', { ...CUSTOMIZATION, exclusions: [] })).not.toBe(withoutOnion);
      expect(
        lineIdOf('combo', { ...CUSTOMIZATION, size: { id: 'size-small', name: 'Chico' } }),
      ).not.toBe(withoutOnion);
      expect(lineIdOf('other-combo', CUSTOMIZATION)).not.toBe(withoutOnion);
    });
  });

  describe('lines of text', () => {
    it('should list the size, the drink, the extras with a plus and the exclusions with "Sin"', () => {
      expect(customizationLines(CUSTOMIZATION)).toEqual([
        'Grande',
        'Refresco de cola',
        '+ Queso extra',
        '+ Tocino',
        'Sin cebolla',
      ]);
    });

    it('should list nothing for a product with no options', () => {
      expect(customizationLines(null)).toEqual([]);
      expect(choiceLines({})).toEqual([]);
      expect(choiceLines({ size: null, drink: null, extras: [], exclusions: [] })).toEqual([]);
    });
  });

  describe('toRequestItem', () => {
    it('should send only the product and the quantity when there are no options', () => {
      // Arrange
      const item: OrderDraftItem = {
        lineId: 'burger',
        productId: 'burger',
        name: 'Hamburguesa',
        unitPrice: 79,
        quantity: 2,
        customization: null,
      };

      // Assert
      expect(toRequestItem(item)).toEqual({ productId: 'burger', quantity: 2 });
    });

    it('should send the ids of the options and never a price', () => {
      // Arrange
      const item: OrderDraftItem = {
        lineId: lineIdOf('combo', CUSTOMIZATION),
        productId: 'combo',
        name: 'Combo Clásico',
        unitPrice: 174,
        quantity: 1,
        customization: CUSTOMIZATION,
      };

      // Assert
      expect(toRequestItem(item)).toEqual({
        productId: 'combo',
        quantity: 1,
        sizeId: 'size-large',
        drinkId: 'drink-cola',
        extraIds: ['extra-cheese', 'extra-bacon'],
        exclusionIds: ['no-onion'],
      });
    });
  });
});
