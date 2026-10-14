import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { TOAST_DURATION_MS, ToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should list the toast with the bell icon when it is shown without an icon', () => {
    // Arrange
    const service = TestBed.inject(ToastService);

    // Act
    service.show({ title: 'Nueva actualización', message: 'Orden #1042 lista en 8 min' });

    // Assert
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0]?.icon).toBe('bell');
  });

  it('should remove only that toast when it is dismissed', () => {
    // Arrange
    const service = TestBed.inject(ToastService);
    const first = service.show({ title: 'Uno', message: 'a' });
    service.show({ title: 'Dos', message: 'b' });

    // Act
    service.dismiss(first);

    // Assert
    expect(service.toasts().map((toast) => toast.title)).toEqual(['Dos']);
  });

  it('should close the toast by itself when its time is over', () => {
    // Arrange
    const service = TestBed.inject(ToastService);
    service.show({ title: 'Uno', message: 'a' });

    // Act
    vi.advanceTimersByTime(TOAST_DURATION_MS);

    // Assert
    expect(service.toasts()).toHaveLength(0);
  });
});
