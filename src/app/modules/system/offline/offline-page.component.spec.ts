import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PAGE_RELOAD } from '@shared/services/app-update.service';
import { renderComponent, rootElement } from '@shared/testing/render';
import { OfflinePageComponent } from './offline-page.component';

describe('OfflinePageComponent', () => {
  it('should reload the page when the user tries the connection again', async () => {
    // Arrange
    const reload = vi.fn();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: PAGE_RELOAD, useValue: reload }],
    });
    const fixture = await renderComponent(OfflinePageComponent);

    // Act
    rootElement(fixture).querySelector<HTMLButtonElement>('[data-testid="retry"]')?.click();

    // Assert
    expect(reload).toHaveBeenCalledOnce();
  });
});
