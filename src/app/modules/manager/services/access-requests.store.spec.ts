import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';

import { EmployeeRole } from '@shared/auth/auth.models';

import { ACCESS_REQUEST_MESSAGES } from '../models/access-requests.messages';
import type { AccessRequests } from '../models/manager.models';
import { AccessRequestsStore } from './access-requests.store';
import { MANAGER_API, type ManagerApi } from './manager-api';

const PENDING: AccessRequests = {
  accounts: [
    {
      id: 'account-1',
      fullName: 'Ana López',
      role: EmployeeRole.Waiter,
      requestedAt: '2026-11-12T15:00:00Z',
    },
  ],
  pinResets: [
    {
      employeeId: 'reset-1',
      fullName: 'Marta Ruiz',
      role: EmployeeRole.Kitchen,
      requestedAt: '2026-11-12T15:05:00Z',
    },
  ],
};

const NOTHING: AccessRequests = { accounts: [], pinResets: [] };

describe('AccessRequestsStore', () => {
  let getAccessRequests: ReturnType<typeof vi.fn<() => Observable<AccessRequests>>>;
  let approveAccount: ReturnType<typeof vi.fn<(id: string) => Observable<void>>>;
  let rejectAccount: ReturnType<typeof vi.fn<(id: string) => Observable<void>>>;
  let assignTemporaryPin: ReturnType<typeof vi.fn<(id: string, pin: string) => Observable<void>>>;

  function createStore(): AccessRequestsStore {
    const api: ManagerApi = {
      getDashboard: vi.fn(),
      getOrders: vi.fn(),
      getAccessRequests,
      approveAccount,
      rejectAccount,
      assignTemporaryPin,
    };
    TestBed.configureTestingModule({
      providers: [{ provide: MANAGER_API, useValue: api }, AccessRequestsStore],
    });
    return TestBed.inject(AccessRequestsStore);
  }

  beforeEach(() => {
    getAccessRequests = vi.fn(() => of(PENDING));
    approveAccount = vi.fn(() => of(undefined));
    rejectAccount = vi.fn(() => of(undefined));
    assignTemporaryPin = vi.fn(() => of(undefined));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('should load the pending requests when it is created', () => {
    // Act
    const store = createStore();

    // Assert
    expect(store.requests()).toEqual(PENDING);
    expect(store.isEmpty()).toBe(false);
    expect(store.loadFailed()).toBe(false);
  });

  it('should be empty when the API answers no requests (CA4)', () => {
    // Arrange
    getAccessRequests.mockReturnValue(of(NOTHING));

    // Act
    const store = createStore();

    // Assert
    expect(store.isEmpty()).toBe(true);
  });

  it('should not be empty before the first answer arrives', () => {
    // Arrange
    getAccessRequests.mockReturnValue(new Observable<AccessRequests>());

    // Act
    const store = createStore();

    // Assert
    expect(store.requests()).toBeNull();
    expect(store.isEmpty()).toBe(false);
    expect(store.isLoading()).toBe(true);
  });

  it('should say the list failed to load and keep the last one when the API is unreachable', () => {
    // Arrange
    const store = createStore();
    getAccessRequests.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

    // Act
    store.refresh();

    // Assert
    expect(store.loadFailed()).toBe(true);
    expect(store.requests()).toEqual(PENDING);
  });

  it('should approve the account, tell it, and read the list again (CA1)', async () => {
    // Arrange
    const store = createStore();
    getAccessRequests.mockReturnValue(of({ ...PENDING, accounts: [] }));

    // Act
    const done = await store.approve('account-1', 'Ana López');

    // Assert
    expect(done).toBe(true);
    expect(approveAccount).toHaveBeenCalledWith('account-1');
    expect(store.feedback()).toEqual({
      kind: 'success',
      message: 'Se aprobó la cuenta de Ana López.',
    });
    expect(store.requests()?.accounts).toEqual([]);
    expect(store.busyEmployeeId()).toBeNull();
  });

  it('should reject the account, tell it, and read the list again (CA2)', async () => {
    // Arrange
    const store = createStore();
    getAccessRequests.mockReturnValue(of({ ...PENDING, accounts: [] }));

    // Act
    const done = await store.reject('account-1', 'Ana López');

    // Assert
    expect(done).toBe(true);
    expect(rejectAccount).toHaveBeenCalledWith('account-1');
    expect(store.feedback()?.message).toBe('Se rechazó la cuenta de Ana López.');
    expect(store.requests()?.accounts).toEqual([]);
  });

  it('should assign the temporary PIN and read the list again, so the request disappears (CA3)', async () => {
    // Arrange
    const store = createStore();
    getAccessRequests.mockReturnValue(of({ ...PENDING, pinResets: [] }));

    // Act
    const done = await store.assignTemporaryPin('reset-1', 'Marta Ruiz', '9087');

    // Assert
    expect(done).toBe(true);
    expect(assignTemporaryPin).toHaveBeenCalledWith('reset-1', '9087');
    expect(store.feedback()?.message).toBe('Se asignó el PIN temporal a Marta Ruiz.');
    expect(store.requests()?.pinResets).toEqual([]);
  });

  it('should show the message of the API and read the list again when another manager answered first', async () => {
    // Arrange
    const store = createStore();
    approveAccount.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { detail: 'Esta solicitud ya fue atendida. Actualiza la lista.' },
          }),
      ),
    );
    getAccessRequests.mockClear();
    getAccessRequests.mockReturnValue(of(NOTHING));

    // Act
    const done = await store.approve('account-1', 'Ana López');

    // Assert
    expect(done).toBe(false);
    expect(store.feedback()).toEqual({
      kind: 'error',
      message: 'Esta solicitud ya fue atendida. Actualiza la lista.',
    });
    expect(getAccessRequests).toHaveBeenCalledOnce();
    expect(store.isEmpty()).toBe(true);
  });

  it('should say there is no connection and keep the list when the request cannot be sent', async () => {
    // Arrange
    const store = createStore();
    assignTemporaryPin.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    getAccessRequests.mockClear();

    // Act
    const done = await store.assignTemporaryPin('reset-1', 'Marta Ruiz', '9087');

    // Assert
    expect(done).toBe(false);
    expect(store.feedback()).toEqual({ kind: 'error', message: ACCESS_REQUEST_MESSAGES.network });
    expect(getAccessRequests).not.toHaveBeenCalled();
    expect(store.requests()).toEqual(PENDING);
  });

  it('should send nothing while another action is in flight', async () => {
    // Arrange
    const store = createStore();
    approveAccount.mockReturnValue(new Observable<void>());
    void store.approve('account-1', 'Ana López');

    // Act
    const second = await store.reject('account-1', 'Ana López');

    // Assert
    expect(second).toBe(false);
    expect(rejectAccount).not.toHaveBeenCalled();
    expect(store.busyEmployeeId()).toBe('account-1');
  });
});
