export const PIN_LENGTH = 4;

export enum EmployeeRole {
  Waiter = 'Waiter',
  Kitchen = 'Kitchen',
  Manager = 'Manager',
}
export interface EmployeeOption {
  readonly id: string;
  readonly displayName: string;
}

export interface PinLoginRequest {
  readonly employeeId: string;
  readonly pin: string;
}

export interface PasswordLoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface PinResetRequest {
  readonly employeeId: string;
}

/** The roles a new employee can ask for from the login screen. The manager role is never requested from there. */
export type RequestableRole = EmployeeRole.Waiter | EmployeeRole.Kitchen;

/** Body of `POST /auth/registration-requests` (HU_14). `email` is the email or the user name. */
export interface RegisterEmployeeRequest {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly role: RequestableRole;
  readonly pin: string;
  readonly pinConfirmation: string;
  readonly acceptedPrivacyNotice: boolean;
}

export interface SessionEmployee {
  readonly id: string;
  readonly displayName: string;
  readonly role: EmployeeRole;
}

export interface LoginResponse {
  readonly accessToken: string;
  readonly expiresAt: string;
  readonly employee: SessionEmployee;
}

export type Session = LoginResponse;
