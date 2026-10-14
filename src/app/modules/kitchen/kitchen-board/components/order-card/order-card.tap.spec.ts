import { TestBed } from '@angular/core/testing';

import type { KitchenOrder } from '../../models/kitchen.models';
import { OrderCardComponent } from './order-card.component';

const CREATED_AT = Date.parse('2026-10-14T18:00:00Z');

function order(status: KitchenOrder['status']): KitchenOrder {
  return {
    id: 'order-7',
    orderNumber: 7,
    channel: 'DineIn',
    status,
    tableNumber: 3,
    createdAt: new Date(CREATED_AT).toISOString(),
    items: [],
  };
}

function render(
  status: KitchenOrder['status'],
  busy = false,
): { element: HTMLElement; tapped: KitchenOrder[]; button: HTMLButtonElement | null } {
  const fixture = TestBed.createComponent(OrderCardComponent);
  fixture.componentRef.setInput('order', order(status));
  fixture.componentRef.setInput('now', CREATED_AT);
  fixture.componentRef.setInput('busy', busy);
  const tapped: KitchenOrder[] = [];
  fixture.componentInstance.advance.subscribe((value) => tapped.push(value));
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return { element, tapped, button: element.querySelector<HTMLButtonElement>('.order-card__tap') };
}

describe('OrderCardComponent tap (HU_05)', () => {
  it('should ask to move the order when the card is tapped', () => {
    // Arrange
    const { button, tapped } = render('New');

    // Act
    button?.click();

    // Assert
    expect(tapped.map((item) => item.id)).toEqual(['order-7']);
  });

  it('should say what the tap does, for screen readers', () => {
    // Act
    const { button, element } = render('InPreparation');

    // Assert
    expect(button?.getAttribute('aria-label')).toBe('Pasar el pedido 7 a Listo');
    expect(element.textContent).toContain('Toca cuando esté listo');
  });

  it('should not be tappable when the order is ready', () => {
    // Act
    const { button, element } = render('Ready');

    // Assert
    expect(button).toBeNull();
    expect(element.textContent).toContain('Esperando al mesero');
  });

  it('should ignore taps while the change is being saved', () => {
    // Arrange
    const { button, tapped, element } = render('New', true);

    // Act
    button?.click();

    // Assert
    expect(button?.disabled).toBe(true);
    expect(tapped).toEqual([]);
    expect(element.textContent).toContain('Guardando…');
  });
});
