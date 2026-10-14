import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { renderComponent, rootElement } from '@shared/testing/render';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('should offer the pickup order and the staff access when the home opens', async () => {
    // Act
    const fixture = await renderComponent(HomePageComponent);

    // Assert
    const element = rootElement(fixture);
    expect(element.querySelector('h1')?.textContent).toContain('Tu mostrador');
    expect(element.querySelector('[data-testid="pickup-order"]')?.getAttribute('href')).toBe(
      '/catalog',
    );
    expect(element.querySelector('[data-testid="staff-access"]')?.getAttribute('href')).toBe(
      '/login',
    );
  });

  it('should list the three steps of the pickup flow when the home opens', async () => {
    // Act
    const fixture = await renderComponent(HomePageComponent);

    // Assert
    expect(rootElement(fixture).querySelectorAll('.step')).toHaveLength(3);
  });
});
