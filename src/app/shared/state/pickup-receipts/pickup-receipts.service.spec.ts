import { TestBed } from '@angular/core/testing';

import { MemoryStorage } from '@shared/testing/memory-storage';

import {
  MAX_RECEIPTS,
  PICKUP_RECEIPTS_STORAGE,
  PickupReceiptsService,
} from './pickup-receipts.service';

describe('PickupReceiptsService', () => {
  let storage: MemoryStorage;

  function createService(): PickupReceiptsService {
    TestBed.configureTestingModule({
      providers: [{ provide: PICKUP_RECEIPTS_STORAGE, useValue: storage }],
    });
    return TestBed.inject(PickupReceiptsService);
  }

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('should keep a receipt for each active order, so a second order never hides the first', () => {
    // Arrange
    const service = createService();

    // Act
    service.add({ clientOrderId: 'a', orderNumber: 1 });
    service.add({ clientOrderId: 'b', orderNumber: 2 });

    // Assert
    expect(service.receipts().map((receipt) => receipt.clientOrderId)).toEqual(['a', 'b']);
  });

  it('should drop the oldest receipt when there would be more than the active limit', () => {
    // Arrange
    const service = createService();

    // Act
    ['a', 'b', 'c'].forEach((id, index) => service.add({ clientOrderId: id, orderNumber: index }));

    // Assert
    expect(MAX_RECEIPTS).toBe(2);
    expect(service.receipts().map((receipt) => receipt.clientOrderId)).toEqual(['b', 'c']);
  });

  it('should not repeat a receipt that is added twice', () => {
    // Arrange
    const service = createService();

    // Act
    service.add({ clientOrderId: 'a', orderNumber: 1 });
    service.add({ clientOrderId: 'a', orderNumber: 1 });

    // Assert
    expect(service.receipts()).toHaveLength(1);
  });

  it('should remove a receipt when its order is delivered', () => {
    // Arrange
    const service = createService();
    service.add({ clientOrderId: 'a', orderNumber: 1 });
    service.add({ clientOrderId: 'b', orderNumber: 2 });

    // Act
    service.remove('a');

    // Assert
    expect(service.receipts().map((receipt) => receipt.clientOrderId)).toEqual(['b']);
  });

  it('should find the receipts again in a later visit', () => {
    // Arrange
    createService().add({ clientOrderId: '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b', orderNumber: 7 });
    TestBed.resetTestingModule();

    // Act
    const service = createService();

    // Assert
    expect(service.receipts()).toEqual([
      { clientOrderId: '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b', orderNumber: 7 },
    ]);
  });

  it('should ignore a stored receipt whose id is not a GUID, because this app never wrote it', () => {
    // Arrange
    storage.setItem(
      'itacr.pickup-receipts',
      JSON.stringify([
        { clientOrderId: '../kitchen/queue', orderNumber: 1 },
        { clientOrderId: '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b', orderNumber: 2 },
      ]),
    );

    // Act
    const service = createService();

    // Assert
    expect(service.receipts().map((receipt) => receipt.orderNumber)).toEqual([2]);
  });

  it('should ignore stored data that is not a list of receipts', () => {
    // Arrange
    storage.setItem('itacr.pickup-receipts', '{"not":"a list"}');

    // Act
    const service = createService();

    // Assert
    expect(service.receipts()).toEqual([]);
  });

  it('should never store the name or the phone of the customer', () => {
    // Arrange
    const service = createService();

    // Act
    service.add({ clientOrderId: 'a', orderNumber: 1 });

    // Assert
    expect(storage.getItem('itacr.pickup-receipts')).toBe(
      '[{"clientOrderId":"a","orderNumber":1}]',
    );
  });
});
