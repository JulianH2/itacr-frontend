import { computed, Injectable, InjectionToken, inject, signal } from '@angular/core';

import { EmployeeRole, Session, SessionEmployee } from './auth.models';

export const SESSION_STORAGE = new InjectionToken<Storage>('SESSION_STORAGE', {
  providedIn: 'root',
  factory: () => localStorage,
});

const SESSION_KEY = 'itacr.session';
const LAST_EMPLOYEE_KEY = 'itacr.last-employee';

const EMPLOYEE_ROLES: readonly string[] = Object.values(EmployeeRole);

function isSessionEmployee(value: unknown): value is SessionEmployee {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['id'] === 'string' &&
    typeof candidate['displayName'] === 'string' &&
    typeof candidate['role'] === 'string' &&
    EMPLOYEE_ROLES.includes(candidate['role'])
  );
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['accessToken'] === 'string' &&
    typeof candidate['expiresAt'] === 'string' &&
    !Number.isNaN(Date.parse(candidate['expiresAt'])) &&
    isSessionEmployee(candidate['employee'])
  );
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly storage = inject(SESSION_STORAGE);
  private readonly sessionState = signal<Session | null>(this.read(SESSION_KEY, isSession));
  private readonly lastEmployeeState = signal<SessionEmployee | null>(
    this.read(LAST_EMPLOYEE_KEY, isSessionEmployee),
  );

  readonly session = this.sessionState.asReadonly();
  readonly employee = computed(() => this.sessionState()?.employee ?? null);
  readonly lastEmployee = this.lastEmployeeState.asReadonly();

  start(session: Session): void {
    this.storage.setItem(SESSION_KEY, JSON.stringify(session));
    this.storage.removeItem(LAST_EMPLOYEE_KEY);
    this.sessionState.set(session);
    this.lastEmployeeState.set(null);
  }

  isActive(now: number = Date.now()): boolean {
    const session = this.sessionState();
    return session !== null && Date.parse(session.expiresAt) > now;
  }

  accessToken(): string | null {
    const session = this.sessionState();
    return session !== null && this.isActive() ? session.accessToken : null;
  }

  expire(): void {
    const employee = this.sessionState()?.employee ?? null;
    this.storage.removeItem(SESSION_KEY);
    this.sessionState.set(null);
    if (employee !== null) {
      this.storage.setItem(LAST_EMPLOYEE_KEY, JSON.stringify(employee));
      this.lastEmployeeState.set(employee);
    }
  }

  clear(): void {
    this.storage.removeItem(SESSION_KEY);
    this.storage.removeItem(LAST_EMPLOYEE_KEY);
    this.sessionState.set(null);
    this.lastEmployeeState.set(null);
  }

  private read<T>(key: string, isValid: (value: unknown) => value is T): T | null {
    const raw = this.storage.getItem(key);
    if (raw === null) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return isValid(parsed) ? parsed : null;
    } catch {
      this.storage.removeItem(key);
      return null;
    }
  }
}
