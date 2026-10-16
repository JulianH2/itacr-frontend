/** Spanish messages of the pickup flow. The server messages (Problem Details) win when the API sends one. */
export const PICKUP_MESSAGES = {
  required: 'Este campo es obligatorio.',
  nameLength: 'El nombre debe tener entre 2 y 60 caracteres.',
  phoneLength: 'El teléfono debe tener 10 dígitos.',
  phoneInvalid: 'Escribe un teléfono válido.',
  network: 'No pudimos enviar tu pedido. Revisa tu conexión e inténtalo de nuevo.',
  tooManyRequests: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  unexpected: 'No pudimos enviar tu pedido. Inténtalo de nuevo.',
  trackingUnavailable: 'No pudimos actualizar el estado. Lo intentaremos de nuevo.',
} as const;
