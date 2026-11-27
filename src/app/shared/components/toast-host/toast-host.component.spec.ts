import { TestBed } from '@angular/core/testing';

import { ToastService } from '@shared/services/toast.service';
import { renderComponent, rootElement } from '@shared/testing/render';
import { ToastHostComponent } from './toast-host.component';

describe('ToastHostComponent', () => {
  it('should show each toast and close it when its button is pressed', async () => {
    // Arrange
    const fixture = await renderComponent(ToastHostComponent);
    const toasts = TestBed.inject(ToastService);
    toasts.show({ title: 'Nueva actualización', message: 'Orden #1042 lista' });
    await fixture.whenStable();
    const toast = rootElement(fixture).querySelector('[data-testid="toast"]');
    expect(toast?.textContent).toContain('Orden #1042 lista');

    // Act
    toast?.querySelector('button')?.click();
    await fixture.whenStable();

    // Assert
    expect(rootElement(fixture).querySelectorAll('[data-testid="toast"]')).toHaveLength(0);
  });
});
