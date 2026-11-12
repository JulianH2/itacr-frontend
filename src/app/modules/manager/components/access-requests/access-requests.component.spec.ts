import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { type Observable, of } from 'rxjs';

import { EmployeeRole } from '@shared/auth/auth.models';

import type { AccessRequests } from '../../models/manager.models';
import { MANAGER_API, type ManagerApi } from '../../services/manager-api';
import { AccessRequestsComponent } from './access-requests.component';

const ACCOUNT = {
  id: 'account-1',
  fullName: 'Ana López',
  role: EmployeeRole.Waiter,
  requestedAt: '2026-11-12T15:00:00Z',
};

const RESET = {
  employeeId: 'reset-1',
  fullName: 'Marta Ruiz',
  role: EmployeeRole.Kitchen,
  requestedAt: '2026-11-12T15:05:00Z',
};

describe('AccessRequestsComponent', () => {
  let pending: AccessRequests;
  let approveAccount: ReturnType<typeof vi.fn<(id: string) => Observable<void>>>;
  let rejectAccount: ReturnType<typeof vi.fn<(id: string) => Observable<void>>>;
  let assignTemporaryPin: ReturnType<typeof vi.fn<(id: string, pin: string) => Observable<void>>>;
  let fixture: ComponentFixture<AccessRequestsComponent>;
  let section: HTMLElement;

  async function render(): Promise<void> {
    const api: ManagerApi = {
      getDashboard: vi.fn(),
      getOrders: vi.fn(),
      getAccessRequests: () => of(pending),
      approveAccount,
      rejectAccount,
      assignTemporaryPin,
    };
    await TestBed.configureTestingModule({
      imports: [AccessRequestsComponent],
      providers: [{ provide: MANAGER_API, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(AccessRequestsComponent);
    await settle();
    section = fixture.nativeElement as HTMLElement;
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function byTestId(testId: string): HTMLElement | null {
    return section.querySelector(`[data-testid="${testId}"]`);
  }

  async function click(testId: string): Promise<void> {
    (byTestId(testId) as HTMLButtonElement).click();
    await settle();
  }

  async function type(testId: string, value: string): Promise<void> {
    const input = byTestId(testId) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
  }

  beforeEach(() => {
    pending = { accounts: [ACCOUNT], pinResets: [RESET] };
    approveAccount = vi.fn(() => {
      pending = { ...pending, accounts: [] };
      return of(undefined);
    });
    rejectAccount = vi.fn(() => {
      pending = { ...pending, accounts: [] };
      return of(undefined);
    });
    assignTemporaryPin = vi.fn(() => {
      pending = { ...pending, pinResets: [] };
      return of(undefined);
    });
  });

  it('should list the pending accounts with their name and role, and the PIN resets', async () => {
    // Act
    await render();

    // Assert
    expect(byTestId('account-account-1')?.textContent).toContain('Ana López');
    expect(byTestId('account-account-1')?.textContent).toContain('Mesero');
    expect(byTestId('pin-reset-reset-1')?.textContent).toContain('Marta Ruiz');
    expect(byTestId('pin-reset-reset-1')?.textContent).toContain('Cocina');
    expect(byTestId('requests-empty')).toBeNull();
  });

  it('should approve the account, tell it, and take it off the list (CA1)', async () => {
    // Arrange
    await render();

    // Act
    await click('approve');

    // Assert
    expect(approveAccount).toHaveBeenCalledWith('account-1');
    expect(byTestId('requests-feedback')?.textContent).toContain(
      'Se aprobó la cuenta de Ana López.',
    );
    expect(byTestId('account-account-1')).toBeNull();
  });

  it('should reject the account, tell it, and take it off the list (CA2)', async () => {
    // Arrange
    await render();

    // Act
    await click('reject');

    // Assert
    expect(rejectAccount).toHaveBeenCalledWith('account-1');
    expect(byTestId('requests-feedback')?.textContent).toContain(
      'Se rechazó la cuenta de Ana López.',
    );
    expect(byTestId('account-account-1')).toBeNull();
  });

  it('should assign a temporary PIN of 4 digits and take the request off the list (CA3)', async () => {
    // Arrange
    await render();
    await click('open-pin');

    // Act
    await type('temporary-pin', '9087');
    await click('save-pin');

    // Assert
    expect(assignTemporaryPin).toHaveBeenCalledWith('reset-1', '9087');
    expect(byTestId('requests-feedback')?.textContent).toContain(
      'Se asignó el PIN temporal a Marta Ruiz.',
    );
    expect(byTestId('pin-reset-reset-1')).toBeNull();
  });

  it.each(['', '123', '12a4'])(
    'should ask for 4 digits and send nothing when the temporary PIN is "%s"',
    async (value) => {
      // Arrange
      await render();
      await click('open-pin');

      // Act
      await type('temporary-pin', value);
      await click('save-pin');

      // Assert
      expect(byTestId('error-temporary-pin')?.textContent).toContain(
        'El PIN debe tener 4 dígitos.',
      );
      expect(assignTemporaryPin).not.toHaveBeenCalled();
    },
  );

  it('should close the PIN form without sending anything when the manager cancels', async () => {
    // Arrange
    await render();
    await click('open-pin');

    // Act
    await click('cancel-pin');

    // Assert
    expect(byTestId('temporary-pin')).toBeNull();
    expect(byTestId('open-pin')).not.toBeNull();
    expect(assignTemporaryPin).not.toHaveBeenCalled();
  });

  it('should say there are no pending requests when there are none (CA4)', async () => {
    // Arrange
    pending = { accounts: [], pinResets: [] };

    // Act
    await render();

    // Assert
    expect(byTestId('requests-empty')?.textContent).toContain('No hay solicitudes pendientes.');
    expect(byTestId('approve')).toBeNull();
  });

  it('should say there are no pending requests after the last one is answered (CA4)', async () => {
    // Arrange
    pending = { accounts: [ACCOUNT], pinResets: [] };
    await render();

    // Act
    await click('approve');

    // Assert
    expect(byTestId('requests-empty')?.textContent).toContain('No hay solicitudes pendientes.');
  });
});
