/** The texts of the section of access requests (HU_15). The API answers its own errors in Spanish and they are shown as they come. */
export const ACCESS_REQUEST_MESSAGES = {
  empty: 'No hay solicitudes pendientes.',
  loadFailed: 'No pudimos cargar las solicitudes.',
  approved: (name: string): string => `Se aprobó la cuenta de ${name}.`,
  rejected: (name: string): string => `Se rechazó la cuenta de ${name}.`,
  pinAssigned: (name: string): string => `Se asignó el PIN temporal a ${name}.`,
  pinFourDigits: 'El PIN debe tener 4 dígitos.',
  network: 'No se guardó el cambio: no hay conexión. Inténtalo de nuevo.',
  unexpected: 'No se pudo completar la acción. Inténtalo de nuevo.',
} as const;
