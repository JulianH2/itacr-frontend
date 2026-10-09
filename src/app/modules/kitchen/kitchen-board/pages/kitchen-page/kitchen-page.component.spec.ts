import { signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { type Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import type { KitchenOrder, KitchenQueue } from '../../models/kitchen.models';
import { KITCHEN_API } from '../../services/kitchen-api';
import { KitchenAlertService } from '../../services/kitchen-alert.service';
import { KitchenStore, POLL_INTERVAL_MS } from '../../services/kitchen-store.service';
import { KitchenPageComponent } from './kitchen-page.component';

const NOW = Date.parse('2026-10-09T18:30:00Z');
const MINUTE = 60_000;
const EMPTY_MESSAGE = 'No hay pedidos pendientes.';

function order(
  number: number,
  overrides: Partial<KitchenOrder> & { minutesAgo: number },
): KitchenOrder {
  const { minutesAgo, ...rest } = overrides;
  return {
    id: `order-${number}`,
    orderNumber: number,
    channel: 'DineIn',
    status: 'New',
    tableNumber: 2,
    createdAt: new Date(NOW - minutesAgo * MINUTE).toISOString(),
    items: [
      {
        productName: 'Hamburguesa Clásica',
        quantity: 1,
        size: null,
        drink: null,
        extras: [],
        exclusions: [],
      },
    ],
    ...rest,
  };
}

function queueOf(...orders: KitchenOrder[]): KitchenQueue {
  return { serverTime: new Date(NOW).toISOString(), orders };
}

describe('KitchenPageComponent', () => {
  let answer: () => Observable<KitchenQueue>;
  let alert: {
    isSupported: boolean;
    isEnabled: ReturnType<typeof signal<boolean>>;
    enable: () => void;
    play: () => void;
  };
  let play: Mock<() => void>;
  let enable: Mock<() => void>;

  async function render(): Promise<{
    fixture: ComponentFixture<KitchenPageComponent>;
    page: HTMLElement;
  }> {
    await TestBed.configureTestingModule({ imports: [KitchenPageComponent] })
      .overrideComponent(KitchenPageComponent, {
        set: {
          providers: [
            { provide: KITCHEN_API, useValue: { getQueue: () => answer() } },
            { provide: KitchenAlertService, useValue: alert },
            KitchenStore,
          ],
        },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(KitchenPageComponent);
    await settle(fixture, 0);
    return { fixture, page: fixture.nativeElement as HTMLElement };
  }

  /** Moves the fake clock and lets the polling, the effects and the template catch up. */
  async function settle(
    fixture: ComponentFixture<KitchenPageComponent>,
    ms: number,
  ): Promise<void> {
    vi.advanceTimersByTime(ms);
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();
  }

  function cards(page: HTMLElement, column: string): string[] {
    const section = page.querySelector(`section[aria-label="${column}"]`);
    return Array.from(
      section?.querySelectorAll('.order-card__number') ?? [],
      (card) => card.textContent?.trim() ?? '',
    );
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    answer = () => of(queueOf());
    play = vi.fn<() => void>();
    enable = vi.fn<() => void>();
    alert = { isSupported: true, isEnabled: signal(false), enable, play };
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // CA4
  it('should say there are no pending orders when the queue is empty', async () => {
    // Act
    const { page } = await render();

    // Assert
    expect(page.textContent).toContain(EMPTY_MESSAGE);
    expect(page.querySelector('app-kitchen-column')).toBeNull();
  });

  // CA2
  it('should show the waiter and pickup orders in the New column, oldest first, each with its origin', async () => {
    // Arrange
    answer = () =>
      of(
        queueOf(
          order(2, { channel: 'MobileApp', tableNumber: null, minutesAgo: 3 }),
          order(1, { minutesAgo: 8 }),
          order(3, { status: 'InPreparation', minutesAgo: 6 }),
          order(4, { status: 'Ready', minutesAgo: 9 }),
        ),
      );

    // Act
    const { page } = await render();

    // Assert
    expect(cards(page, 'Nuevos')).toEqual(['#1', '#2']);
    expect(cards(page, 'En preparación')).toEqual(['#3']);
    expect(cards(page, 'Listos')).toEqual(['#4']);
    const origins = Array.from(
      page.querySelectorAll('section[aria-label="Nuevos"] .order-card__origin'),
      (item) => item.textContent?.trim(),
    );
    expect(origins).toEqual(['Mesero · Mesa 2', 'Cliente · Para recoger']);
  });

  // CA1
  it('should add the new order and play the alert on the next poll, without reloading', async () => {
    // Arrange
    answer = () => of(queueOf(order(1, { minutesAgo: 1 })));
    const { fixture, page } = await render();
    expect(play).not.toHaveBeenCalled();

    // Act
    answer = () => of(queueOf(order(1, { minutesAgo: 1 }), order(2, { minutesAgo: 0 })));
    await settle(fixture, POLL_INTERVAL_MS);

    // Assert
    expect(cards(page, 'Nuevos')).toEqual(['#1', '#2']);
    expect(play).toHaveBeenCalledOnce();
  });

  it('should offer to enable the sound until the user does it', async () => {
    // Arrange
    const { fixture, page } = await render();
    const button = page.querySelector<HTMLButtonElement>('.kitchen__button');
    expect(button?.textContent?.trim()).toBe('Activar sonido');

    // Act
    button?.click();
    alert.isEnabled.set(true);
    await settle(fixture, 0);

    // Assert
    expect(enable).toHaveBeenCalledOnce();
    expect(page.textContent).toContain('Sonido activado');
    expect(page.querySelector('.kitchen__button')).toBeNull();
  });

  it('should show an error with a retry button when the queue cannot be loaded', async () => {
    // Arrange
    answer = () => throwError(() => new Error('offline'));
    const { fixture, page } = await render();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      'No pudimos cargar los pedidos',
    );

    // Act
    answer = () => of(queueOf(order(1, { minutesAgo: 1 })));
    Array.from(page.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.trim() === 'Reintentar')
      ?.click();
    await settle(fixture, 0);

    // Assert
    expect(cards(page, 'Nuevos')).toEqual(['#1']);
  });

  it('should keep the board and warn that it may be outdated when a later poll fails', async () => {
    // Arrange
    answer = () => of(queueOf(order(1, { minutesAgo: 1 })));
    const { fixture, page } = await render();

    // Act
    answer = () => throwError(() => new Error('offline'));
    await settle(fixture, POLL_INTERVAL_MS);

    // Assert
    expect(cards(page, 'Nuevos')).toEqual(['#1']);
    expect(page.textContent).toContain('Sin conexión. Mostrando la última actualización.');
  });
});
