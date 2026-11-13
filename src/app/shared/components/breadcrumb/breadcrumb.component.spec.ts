import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { renderComponent, rootElement } from '@shared/testing/render';

import { BreadcrumbComponent } from './breadcrumb.component';

describe('BreadcrumbComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('should show every step of the path as a link, except the current one', async () => {
    // Arrange
    const fixture = await renderComponent(BreadcrumbComponent, {
      crumbs: [
        { label: 'Pedidos', url: '/orders' },
        { label: 'Detalle', url: '/orders/detail/1' },
      ],
    });

    // Act
    const items = rootElement(fixture).querySelectorAll('.crumbs__item');

    // Assert
    expect(items).toHaveLength(2);
    const link = rootElement(fixture).querySelector<HTMLAnchorElement>('.crumbs__link');
    expect(link?.getAttribute('href')).toBe('/orders');
    expect(link?.textContent?.trim()).toBe('Pedidos');
  });

  it('should mark the last step as the current page', async () => {
    // Arrange
    const fixture = await renderComponent(BreadcrumbComponent, {
      crumbs: [
        { label: 'Pedidos', url: '/orders' },
        { label: 'Detalle', url: '/orders/detail/1' },
      ],
    });

    // Act
    const current = rootElement(fixture).querySelector('.crumbs__current');

    // Assert
    expect(current?.textContent?.trim()).toBe('Detalle');
    expect(current?.getAttribute('aria-current')).toBe('page');
  });

  it('should show only the current page when there is a single step', async () => {
    // Arrange
    const fixture = await renderComponent(BreadcrumbComponent, {
      crumbs: [{ label: 'Pedidos', url: '/orders' }],
    });

    // Act
    const element = rootElement(fixture);

    // Assert
    expect(element.querySelectorAll('.crumbs__item')).toHaveLength(1);
    expect(element.querySelector('.crumbs__link')).toBeNull();
    expect(element.querySelector('.crumbs__current')?.textContent?.trim()).toBe('Pedidos');
  });
});
