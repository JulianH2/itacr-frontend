import { TestBed } from '@angular/core/testing';

import { EmployeeRole } from './auth.models';
import { SESSION_STORAGE, SessionService } from './session.service';
import { loginResponse, PAST_EXPIRATION } from '@shared/testing/auth-fixtures';
import { MemoryStorage } from '@shared/testing/memory-storage';

describe('SessionService', () => {
  let storage: MemoryStorage;

  function createService(): SessionService {
    TestBed.configureTestingModule({
      providers: [{ provide: SESSION_STORAGE, useValue: storage }],
    });
    return TestBed.inject(SessionService);
  }

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('should restore the session when the app restarts on the same device', () => {
    // Arrange
    storage.setItem('itacr.session', JSON.stringify(loginResponse(EmployeeRole.Kitchen)));

    // Act
    const service = createService();

    // Assert
    expect(service.employee()?.role).toBe(EmployeeRole.Kitchen);
    expect(service.isActive()).toBe(true);
    expect(service.accessToken()).toBe('access-token');
  });

  it('should not return a token when the shift token expired', () => {
    // Arrange
    const service = createService();

    // Act
    service.start(loginResponse(EmployeeRole.Waiter, PAST_EXPIRATION));

    // Assert
    expect(service.isActive()).toBe(false);
    expect(service.accessToken()).toBeNull();
  });

  it('should remember only the employee when the session expires', () => {
    // Arrange
    const service = createService();
    service.start(loginResponse(EmployeeRole.Waiter));

    // Act
    service.expire();

    // Assert
    expect(service.session()).toBeNull();
    expect(storage.getItem('itacr.session')).toBeNull();
    expect(service.lastEmployee()?.displayName).toBe('Ana M.');
  });

  it('should remove all session data from the device when the employee logs out', () => {
    // Arrange
    const service = createService();
    service.start(loginResponse(EmployeeRole.Waiter));
    service.expire();
    storage.setItem('itacr.pending-orders-marker', 'kept');

    // Act
    service.clear();

    // Assert
    expect(service.session()).toBeNull();
    expect(service.lastEmployee()).toBeNull();
    expect(storage.getItem('itacr.session')).toBeNull();
    expect(storage.getItem('itacr.last-employee')).toBeNull();
    expect(storage.getItem('itacr.pending-orders-marker')).toBe('kept');
  });

  it('should ignore the stored session when it is corrupted', () => {
    // Arrange
    storage.setItem('itacr.session', '{not json');

    // Act
    const service = createService();

    // Assert
    expect(service.session()).toBeNull();
    expect(storage.getItem('itacr.session')).toBeNull();
  });
});
