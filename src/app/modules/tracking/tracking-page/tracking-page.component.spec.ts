import { renderComponent, rootElement } from '@shared/testing/render';
import { TrackingPageComponent } from './tracking-page.component';

describe('TrackingPageComponent', () => {
  it('should show the placeholder of the tracking screen', async () => {
    // Act
    const fixture = await renderComponent(TrackingPageComponent);

    // Assert
    expect(rootElement(fixture).textContent).toContain('Seguimiento');
  });
});
