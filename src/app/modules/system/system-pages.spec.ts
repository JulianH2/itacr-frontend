import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { renderComponent, rootElement } from '@shared/testing/render';
import { NotFoundPageComponent } from './not-found/not-found-page.component';
import { OfflinePageComponent } from './offline/offline-page.component';

describe('system pages', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('should say the page was not found and offer the way home when the address is unknown', async () => {
    // Act
    const fixture = await renderComponent(NotFoundPageComponent);

    // Assert
    const element = rootElement(fixture);
    expect(element.querySelector('h1')?.textContent).toBe('Página no encontrada');
    expect(element.textContent).toContain('Error 404');
    expect(element.querySelector('[data-testid="go-home"]')?.getAttribute('href')).toBe('/');
  });

  it('should tell the app keeps working and offer to retry when there is no connection', async () => {
    // Act
    const fixture = await renderComponent(OfflinePageComponent);

    // Assert
    const element = rootElement(fixture);
    expect(element.querySelector('h1')?.textContent).toBe('Sin conexión a internet');
    expect(element.textContent).toContain('Modo offline activo');
    expect(element.querySelector('[data-testid="retry"]')).not.toBeNull();
    expect(element.querySelector('[data-testid="continue-offline"]')?.getAttribute('href')).toBe(
      '/',
    );
  });
});
