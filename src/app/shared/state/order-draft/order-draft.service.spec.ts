import { TestBed } from '@angular/core/testing';

import type { ComboCustomization, OrderDraftProduct } from './order-draft.model';
import { OrderDraftService } from './order-draft.service';

const CLASSIC_BURGER: OrderDraftProduct = {
  productId: 'burger-classic',
  name: 'Hamburguesa Clásica',
  unitPrice: 79,
};
const FRIES: OrderDraftProduct = { productId: 'fries', name: 'Papas', unitPrice: 35 };

const LARGE = { id: 'size-large', name: 'Grande' };
const COLA = { id: 'drink-cola', name: 'Refresco de cola' };
const CHEESE = { id: 'extra-cheese', name: 'Queso extra', price: 12 };
const BACON = { id: 'extra-bacon', name: 'Tocino', price: 18 };
const NO_ONION = { id: 'no-onion', name: 'Cebolla' };

function combo(customization: ComboCustomization, unitPrice = 156): OrderDraftProduct {
  return { productId: 'combo-classic', name: 'Combo Clásico', unitPrice, customization };
}

describe('OrderDraftService', () => {
  let service: OrderDraftService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderDraftService);
  });

  it('should add a new line with quantity 1 when the product is not in the draft', () => {
    // Act
    service.add(CLASSIC_BURGER);

    // Assert
    expect(service.items()).toEqual([
      { ...CLASSIC_BURGER, lineId: 'burger-classic', quantity: 1, customization: null },
    ]);
    expect(service.itemCount()).toBe(1);
  });

  it('should increase the quantity of the existing line when the same product is added again', () => {
    // Arrange
    service.add(CLASSIC_BURGER);

    // Act
    service.add(CLASSIC_BURGER);

    // Assert
    expect(service.items()).toHaveLength(1);
    expect(service.items()[0].quantity).toBe(2);
  });

  it('should compute item count and total when several products are added', () => {
    // Arrange
    service.add(CLASSIC_BURGER);
    service.add(CLASSIC_BURGER);

    // Act
    service.add(FRIES);

    // Assert
    expect(service.itemCount()).toBe(3);
    expect(service.total()).toBe(193);
  });

  it('should keep the total free of floating point drift when prices have cents', () => {
    // Arrange
    const cheap: OrderDraftProduct = { productId: 'cheap', name: 'Dulce', unitPrice: 0.1 };

    // Act
    service.add(cheap, 3);

    // Assert
    expect(service.total()).toBe(0.3);
  });

  it('should set the quantity when changeQuantity receives a positive integer', () => {
    // Arrange
    service.add(FRIES);

    // Act
    service.changeQuantity(FRIES.productId, 4);

    // Assert
    expect(service.items()[0].quantity).toBe(4);
    expect(service.total()).toBe(140);
  });

  it('should remove the line when changeQuantity receives zero', () => {
    // Arrange
    service.add(FRIES);

    // Act
    service.changeQuantity(FRIES.productId, 0);

    // Assert
    expect(service.items()).toEqual([]);
  });

  it('should remove only the requested line when remove is called', () => {
    // Arrange
    service.add(CLASSIC_BURGER);
    service.add(FRIES);

    // Act
    service.remove(CLASSIC_BURGER.productId);

    // Assert
    expect(service.items().map((item) => item.productId)).toEqual([FRIES.productId]);
  });

  it('should ignore the call when the quantity is not a positive integer', () => {
    // Act
    service.add(FRIES, 0);
    service.add(FRIES, 1.5);

    // Assert
    expect(service.items()).toEqual([]);
  });

  it('should empty the draft when clear is called', () => {
    // Arrange
    service.add(FRIES);

    // Act
    service.clear();

    // Assert
    expect(service.itemCount()).toBe(0);
    expect(service.total()).toBe(0);
  });

  describe('combo lines (HU_12)', () => {
    it('should keep two lines when the same combo has different options', () => {
      // Act
      service.add(combo({ size: LARGE, drink: COLA, extras: [CHEESE], exclusions: [] }));
      service.add(combo({ size: LARGE, drink: COLA, extras: [], exclusions: [NO_ONION] }, 144));

      // Assert
      expect(service.items()).toHaveLength(2);
      expect(service.items().map((item) => item.productId)).toEqual([
        'combo-classic',
        'combo-classic',
      ]);
      expect(service.total()).toBe(300);
    });

    it('should add the quantity to the same line when the options are the same in another order', () => {
      // Act
      service.add(
        combo({ size: LARGE, drink: COLA, extras: [CHEESE, BACON], exclusions: [] }, 174),
      );
      service.add(
        combo({ size: LARGE, drink: COLA, extras: [BACON, CHEESE], exclusions: [] }, 174),
      );

      // Assert
      expect(service.items()).toHaveLength(1);
      expect(service.items()[0].quantity).toBe(2);
    });

    it('should remove only the line that was asked for when two lines are the same combo', () => {
      // Arrange
      service.add(combo({ size: LARGE, drink: COLA, extras: [CHEESE], exclusions: [] }));
      service.add(combo({ size: LARGE, drink: COLA, extras: [], exclusions: [NO_ONION] }, 144));
      const [first, second] = service.items();

      // Act
      service.remove(first.lineId);

      // Assert
      expect(service.items()).toEqual([second]);
    });

    it('should change the quantity of one line without touching the other', () => {
      // Arrange
      service.add(combo({ size: LARGE, drink: COLA, extras: [CHEESE], exclusions: [] }));
      service.add(combo({ size: LARGE, drink: COLA, extras: [], exclusions: [NO_ONION] }, 144));
      const [first] = service.items();

      // Act
      service.changeQuantity(first.lineId, 3);

      // Assert
      expect(service.items().map((item) => item.quantity)).toEqual([3, 1]);
    });

    it('should count each line as a product when the products limit is checked', () => {
      // Arrange
      const limits = { maxProducts: 1 };
      service.add(combo({ size: LARGE, drink: COLA, extras: [CHEESE], exclusions: [] }), 1, limits);

      // Act
      const refusal = service.add(
        combo({ size: LARGE, drink: COLA, extras: [], exclusions: [NO_ONION] }, 144),
        1,
        limits,
      );

      // Assert
      expect(refusal).toBe('products-limit');
    });
  });

  describe('limits', () => {
    const LIMITS = { maxQuantity: 3, maxProducts: 2 };

    it('should add the product and return null when it is within the limits', () => {
      // Act
      const refusal = service.add(CLASSIC_BURGER, 3, LIMITS);

      // Assert
      expect(refusal).toBeNull();
      expect(service.itemCount()).toBe(3);
    });

    it('should refuse one more unit of a product that is at the quantity limit', () => {
      // Arrange
      service.add(CLASSIC_BURGER, 3, LIMITS);

      // Act
      const refusal = service.add(CLASSIC_BURGER, 1, LIMITS);

      // Assert
      expect(refusal).toBe('quantity-limit');
      expect(service.itemCount()).toBe(3);
    });

    it('should refuse a new product when the order already has the most products', () => {
      // Arrange
      service.add(CLASSIC_BURGER, 1, LIMITS);
      service.add(FRIES, 1, LIMITS);

      // Act
      const refusal = service.add(
        { productId: 'soda', name: 'Refresco', unitPrice: 29 },
        1,
        LIMITS,
      );

      // Assert
      expect(refusal).toBe('products-limit');
      expect(service.items()).toHaveLength(2);
    });

    it('should still let a product that is already in the order grow when the products limit is reached', () => {
      // Arrange
      service.add(CLASSIC_BURGER, 1, LIMITS);
      service.add(FRIES, 1, LIMITS);

      // Act
      const refusal = service.add(FRIES, 1, LIMITS);

      // Assert
      expect(refusal).toBeNull();
      expect(service.itemCount()).toBe(3);
    });

    it('should not limit anything when no limits are given', () => {
      // Act
      const refusal = service.add(CLASSIC_BURGER, 99);

      // Assert
      expect(refusal).toBeNull();
      expect(service.itemCount()).toBe(99);
    });
  });

  describe('modifying an order (HU_13)', () => {
    it('should hold the lines of the order and bring back the new order that was waiting when the edit ends', () => {
      // Arrange
      service.add(FRIES);
      const lines = [
        {
          lineId: 'burger-classic',
          productId: 'burger-classic',
          name: 'Hamburguesa Clásica',
          unitPrice: 79,
          quantity: 2,
          customization: null,
        },
      ];

      // Act
      service.beginEdit('order-1', lines);

      // Assert
      expect(service.editingOrderId()).toBe('order-1');
      expect(service.items()).toEqual(lines);
      expect(service.total()).toBe(158);
      service.endEdit();
      expect(service.editingOrderId()).toBeNull();
      expect(service.items().map((item) => item.productId)).toEqual(['fries']);
    });

    it('should keep the changes when the same order starts again, and the first waiting order when another starts', () => {
      // Arrange
      service.add(FRIES);
      service.beginEdit('order-1', []);
      service.add(CLASSIC_BURGER);

      // Act
      service.beginEdit('order-1', []);
      service.beginEdit('order-2', []);
      service.endEdit();

      // Assert
      expect(service.items().map((item) => item.productId)).toEqual(['fries']);
    });

    it('should do nothing when there is no edit to end', () => {
      // Arrange
      service.add(FRIES);

      // Act
      service.endEdit();

      // Assert
      expect(service.items()).toHaveLength(1);
    });
  });
});
