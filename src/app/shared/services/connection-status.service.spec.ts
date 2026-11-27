import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { ConnectionStatusService } from './connection-status.service';

describe('ConnectionStatusService', () => {
  it('should follow the online and offline events of the browser', () => {
    // Arrange
    TestBed.configureTestingModule({});
    const service = TestBed.inject(ConnectionStatusService);

    // Act
    window.dispatchEvent(new Event('offline'));
    const offline = service.online();
    window.dispatchEvent(new Event('online'));

    // Assert
    expect(offline).toBe(false);
    expect(service.online()).toBe(true);
  });

  it('should count as online when there is no window', () => {
    // Arrange
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView: null } }],
    });

    // Act / Assert
    expect(TestBed.inject(ConnectionStatusService).online()).toBe(true);
  });
});
