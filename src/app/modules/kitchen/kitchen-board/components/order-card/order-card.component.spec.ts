import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import type { KitchenOrder } from '../../models/kitchen.models';
import { OrderCardComponent } from './order-card.component';

const CREATED_AT = Date.parse('2026-10-09T18:00:00Z');
const MINUTE = 60_000;

const ORDER: KitchenOrder = {
  id: 'order-1',
  orderNumber: 101,
  channel: 'DineIn',
  status: 'New',
  tableNumber: 4,
  createdAt: new Date(CREATED_AT).toISOString(),
  items: [
    {
      productName: 'Combo Clásico',
      quantity: 2,
      size: 'Grande',
      drink: 'Refresco de Cola',
      extras: ['Queso extra'],
      exclusions: ['Cebolla'],
    },
    { productName: 'Limonada', quantity: 1, size: null, drink: null, extras: [], exclusions: [] },
  ],
};

function render(
  order: KitchenOrder,
  elapsedMs: number,
): { fixture: ComponentFixture<OrderCardComponent>; element: HTMLElement } {
  const fixture = TestBed.createComponent(OrderCardComponent);
  fixture.componentRef.setInput('order', order);
  fixture.componentRef.setInput('now', CREATED_AT + elapsedMs);
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

function text(element: HTMLElement, selector: string): string {
  return element.querySelector(selector)?.textContent?.trim() ?? '';
}

describe('OrderCardComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [OrderCardComponent] }));

  it('should show the number, the origin and the products with their customization', () => {
    // Act
    const { element } = render(ORDER, 2 * MINUTE);

    // Assert
    expect(text(element, '.order-card__number')).toBe('#101');
    expect(text(element, '.order-card__origin')).toBe('Mesero · Mesa 4');
    expect(
      Array.from(element.querySelectorAll('.order-card__product'), (item) => item.textContent),
    ).toEqual(['Combo Clásico', 'Limonada']);
    expect(
      Array.from(element.querySelectorAll('.order-card__details li'), (item) => item.textContent),
    ).toEqual(['Grande', 'Refresco de Cola', '+ Queso extra', 'Sin cebolla']);
  });

  // CA2: a pickup order is clearly different from a waiter order.
  it('should mark a pickup order as coming from the customer', () => {
    // Act
    const { element } = render({ ...ORDER, channel: 'MobileApp', tableNumber: null }, 0);

    // Assert
    expect(text(element, '.order-card__origin')).toBe('Cliente · Para recoger');
    expect(element.querySelector('.order-card')?.getAttribute('data-origin')).toBe('pickup');
  });

  // CA3
  it.each([
    [2 * MINUTE, 'ok', '02:00'],
    [7 * MINUTE, 'warning', '07:00'],
    [11 * MINUTE + 5000, 'late', '11:05'],
  ] as const)('should show the timer of an order that waited %i ms', (elapsed, level, clock) => {
    // Act
    const { element } = render(ORDER, elapsed);

    // Assert
    expect(element.querySelector('.order-card')?.getAttribute('data-level')).toBe(level);
    expect(text(element, '.order-card__timer')).toBe(clock);
    expect(element.querySelector('.order-card__late') !== null).toBe(level === 'late');
  });

  it('should use the thresholds it is given', () => {
    // Arrange
    const { fixture, element } = render(ORDER, 3 * MINUTE);

    // Act
    fixture.componentRef.setInput('thresholds', { warningMinutes: 1, lateMinutes: 2 });
    fixture.detectChanges();

    // Assert
    expect(element.querySelector('.order-card')?.getAttribute('data-level')).toBe('late');
  });
});
