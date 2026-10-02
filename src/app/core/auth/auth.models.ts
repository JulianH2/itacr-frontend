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
