import { MOCK_COMBO_OPTIONS } from '../services/mock-catalog.data';
import { NO_CHOICE, comboUnitPrice, optionsOfType, toCustomization } from './combo-customization';

function id(name: string): string {
  const option = MOCK_COMBO_OPTIONS.find((candidate) => candidate.name === name);
  if (!option) {
    throw new Error(`No option ${name}`);
  }
  return option.id;
}

const CLASSIC_COMBO = 119;

describe('combo customization', () => {
  describe('comboUnitPrice', () => {
    it('should be the price of the combo while nothing is chosen', () => {
      expect(comboUnitPrice(CLASSIC_COMBO, MOCK_COMBO_OPTIONS, NO_CHOICE)).toBe(119);
    });

    it('should add the size and the extra to the price (CA1)', () => {
      // Arrange
      const choice = {
        sizeId: id('Grande'),
        drinkId: id('Refresco de cola'),
        extraIds: [id('Queso extra')],
        exclusionIds: [id('Cebolla')],
      };

      // Assert
      expect(comboUnitPrice(CLASSIC_COMBO, MOCK_COMBO_OPTIONS, choice)).toBe(156);
    });

    it('should add every extra', () => {
      // Arrange
      const choice = {
        ...NO_CHOICE,
        sizeId: id('Mediano'),
        extraIds: [id('Queso extra'), id('Tocino'), id('Jalapeños')],
      };

      // Assert: 119 + 15 + 12 + 18 + 8
      expect(comboUnitPrice(CLASSIC_COMBO, MOCK_COMBO_OPTIONS, choice)).toBe(172);
    });

    it('should not change with the drink or with the ingredients that are left out', () => {
      // Arrange
      const choice = {
        ...NO_CHOICE,
        sizeId: id('Chico'),
        drinkId: id('Agua natural'),
        exclusionIds: [id('Cebolla'), id('Jitomate'), id('Mostaza')],
      };

      // Assert
      expect(comboUnitPrice(CLASSIC_COMBO, MOCK_COMBO_OPTIONS, choice)).toBe(119);
    });

    it('should keep the cents exact', () => {
      // Arrange
      const options = [
        { id: 'size', type: 'Size' as const, name: 'Grande', priceAdjustment: 0.1 },
        { id: 'extra', type: 'Extra' as const, name: 'Salsa', priceAdjustment: 0.2 },
      ];

      // Assert
      expect(
        comboUnitPrice(10.05, options, { ...NO_CHOICE, sizeId: 'size', extraIds: ['extra'] }),
      ).toBe(10.35);
    });
  });

  describe('toCustomization', () => {
    it('should be null until the size and the drink are chosen', () => {
      expect(toCustomization(MOCK_COMBO_OPTIONS, NO_CHOICE)).toBeNull();
      expect(
        toCustomization(MOCK_COMBO_OPTIONS, { ...NO_CHOICE, sizeId: id('Grande') }),
      ).toBeNull();
      expect(
        toCustomization(MOCK_COMBO_OPTIONS, { ...NO_CHOICE, drinkId: id('Agua natural') }),
      ).toBeNull();
    });

    it('should keep the id and the name of each choice, and the price of the extras', () => {
      // Act
      const customization = toCustomization(MOCK_COMBO_OPTIONS, {
        sizeId: id('Grande'),
        drinkId: id('Refresco de cola'),
        extraIds: [id('Tocino')],
        exclusionIds: [id('Cebolla')],
      });

      // Assert
      expect(customization).toEqual({
        size: { id: id('Grande'), name: 'Grande' },
        drink: { id: id('Refresco de cola'), name: 'Refresco de cola' },
        extras: [{ id: id('Tocino'), name: 'Tocino', price: 18 }],
        exclusions: [{ id: id('Cebolla'), name: 'Cebolla' }],
      });
    });
  });

  it('should list the options of a type', () => {
    expect(optionsOfType(MOCK_COMBO_OPTIONS, 'Size').map((option) => option.name)).toEqual([
      'Chico',
      'Mediano',
      'Grande',
    ]);
    expect(optionsOfType(MOCK_COMBO_OPTIONS, 'Exclusion')).toHaveLength(7);
  });
});
