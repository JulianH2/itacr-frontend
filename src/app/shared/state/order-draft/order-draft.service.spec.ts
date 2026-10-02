import { TestBed } from '@angular/core/testing';

import type { OrderDraftProduct } from './order-draft.model';
import { OrderDraftService } from './order-draft.service';

const CLASSIC_BURGER: OrderDraftProduct = {
  productId: 'burger-classic',
  name: 'Hamburguesa Clásica',
  unitPrice: 79,
};
const FRIES: OrderDraftProduct = { productId: 'fries', name: 'Papas', unitPrice: 35 };

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
    expect(service.items()).toEqual([{ ...CLASSIC_BURGER, quantity: 1 }]);
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
});
