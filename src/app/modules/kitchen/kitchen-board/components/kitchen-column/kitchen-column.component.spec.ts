import { TestBed } from '@angular/core/testing';

import type { KitchenOrder } from '../../models/kitchen.models';
import { KitchenColumnComponent } from './kitchen-column.component';

const ORDER: KitchenOrder = {
  id: 'order-7',
  orderNumber: 7,
  channel: 'TakeAway',
  status: 'New',
  tableNumber: null,
  createdAt: '2026-10-14T18:00:00Z',
  items: [],
};

describe('KitchenColumnComponent', () => {
  it('should show its orders and pass on the tap of a card', () => {
    // Arrange
    const fixture = TestBed.createComponent(KitchenColumnComponent);
    fixture.componentRef.setInput('title', 'Nuevos');
    fixture.componentRef.setInput('orders', [ORDER]);
    fixture.componentRef.setInput('now', Date.parse(ORDER.createdAt));
    fixture.componentRef.setInput('busyIds', new Set<string>());
    const advanced: KitchenOrder[] = [];
    fixture.componentInstance.advance.subscribe((order) => advanced.push(order));
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    // Act
    element.querySelector<HTMLButtonElement>('.order-card__tap')?.click();

    // Assert
    expect(element.querySelector('.kitchen-column__count')?.textContent?.trim()).toBe('1');
    expect(advanced).toEqual([ORDER]);
  });
});
