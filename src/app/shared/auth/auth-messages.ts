import { EmployeeRole } from './auth.models';

/** Problem Details `type` values returned by the auth endpoints of itacr-backend. */
export const AUTH_PROBLEM_TYPES = {
  invalidCredentials: 'https://itacr.app/problems/invalid-credentials',
  accountPendingApproval: 'https://itacr.app/problems/account-pending-approval',
  accountInactive: 'https://itacr.app/problems/account-inactive',
  accountLocked: 'https://itacr.app/problems/account-locked',
  accountAlreadyExists: 'https://itacr.app/problems/account-already-exists',
} as const;

export const AUTH_MESSAGES = {
  pinIncomplete: 'Ingresa los 4 dígitos de tu PIN.',
  invalidPin: 'PIN incorrecto. Inténtalo de nuevo.',
  invalidPassword: 'Correo o contraseña incorrectos.',
  pendingApproval: 'Tu acceso está pendiente de aprobación del gerente.',
  inactive: 'Tu cuenta no está activa. Comunícate con el gerente.',
  locked: 'Demasiados intentos fallidos. Inténtalo de nuevo en 15 minutos.',
  tooManyRequests: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
  pinResetSent: 'Solicitud enviada. El gerente restablecerá tu PIN.',
  sessionExpired: 'Tu sesión terminó. Ingresa tu PIN para continuar.',
  noEmployees: 'No hay personal activo con este rol.',
  network: 'No hay conexión con el servidor. Inténtalo de nuevo.',
  unexpected: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
} as const;

export const ROLE_LABELS: Readonly<Record<EmployeeRole, string>> = {
  [EmployeeRole.Waiter]: 'Mesero',
  [EmployeeRole.Kitchen]: 'Cocina',
  [EmployeeRole.Manager]: 'Gerente',
};

export const ROLE_HOME: Readonly<Record<EmployeeRole, string>> = {
  [EmployeeRole.Waiter]: '/orders',
  [EmployeeRole.Kitchen]: '/kitchen',
  [EmployeeRole.Manager]: '/manager',
};

export const ROLE_HOME_LABELS: Readonly<Record<EmployeeRole, string>> = {
  [EmployeeRole.Waiter]: 'Dashboard del Mesero',
  [EmployeeRole.Kitchen]: 'Vista de Cocina',
  [EmployeeRole.Manager]: 'Dashboard de métricas',
};

/** The form to ask for an account (HU_14). The texts of the API are the same, so the screen and the API say the same. */
export const REGISTRATION_MESSAGES = {
  sent: 'Solicitud enviada. Tu acceso quedará pendiente hasta que el gerente lo apruebe.',
  required: 'Este campo es obligatorio.',
  fullNameLength: 'El nombre debe tener entre 2 y 120 caracteres.',
  emailOrUser: 'Escribe un correo o un usuario sin espacios, de 3 a 254 caracteres.',
  phoneLength: 'El teléfono debe tener 10 dígitos.',
  pinFourDigits: 'El PIN debe tener 4 dígitos.',
  pinsDoNotMatch: 'Los PIN no coinciden.',
  privacyRequired: 'Debes aceptar el aviso de privacidad para continuar.',
  accountExists: 'Ya existe una cuenta o una solicitud con ese correo o usuario.',
  tooManyRequests: 'Demasiadas solicitudes desde esta conexión. Inténtalo de nuevo más tarde.',
} as const;
