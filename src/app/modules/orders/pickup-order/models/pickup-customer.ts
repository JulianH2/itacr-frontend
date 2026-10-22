import { PICKUP_MESSAGES } from '../pickup-order.messages';

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 60;
export const PHONE_LENGTH = 10;

const PHONE_FORMAT = /^\d{10}$/;
const REPEATED_DIGIT = /^(\d)\1{9}$/;
const SEQUENTIAL_PHONE = '1234567890';

/** Same rules as the backend (ITACR-42), so the form says what is wrong before sending. The server stays the authority. */
export function validateName(value: string): string | null {
  const name = value.trim();
  if (name.length === 0) {
    return PICKUP_MESSAGES.required;
  }
  return name.length < NAME_MIN_LENGTH || name.length > NAME_MAX_LENGTH
    ? PICKUP_MESSAGES.nameLength
    : null;
}

/** Exactly 10 digits, and not a placeholder such as 0000000000 or 1234567890. */
export function validatePhone(value: string): string | null {
  if (value.length === 0) {
    return PICKUP_MESSAGES.required;
  }
  if (!PHONE_FORMAT.test(value)) {
    return PICKUP_MESSAGES.phoneLength;
  }
  return REPEATED_DIGIT.test(value) || value === SEQUENTIAL_PHONE
    ? PICKUP_MESSAGES.phoneInvalid
    : null;
}

/** Keeps only the digits the customer typed, up to the length of a phone number. */
export function toPhoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, PHONE_LENGTH);
}
