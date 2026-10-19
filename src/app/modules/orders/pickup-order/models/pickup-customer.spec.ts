import { PICKUP_MESSAGES } from '../pickup-order.messages';
import { toPhoneDigits, validateName, validatePhone } from './pickup-customer';

describe('validatePhone', () => {
  // CA2 of HU_06: a missing phone says the field is required.
  it('should ask for the phone when it is empty', () => {
    // Act / Assert
    expect(validatePhone('')).toBe(PICKUP_MESSAGES.required);
  });

  it.each(['771234', '77123456789', '771abc4567'])(
    'should ask for 10 digits when the phone is %s',
    (phone) => {
      // Act / Assert
      expect(validatePhone(phone)).toBe(PICKUP_MESSAGES.phoneLength);
    },
  );

  it.each(['0000000000', '7777777777', '1234567890'])(
    'should refuse the placeholder phone %s',
    (phone) => {
      // Act / Assert
      expect(validatePhone(phone)).toBe(PICKUP_MESSAGES.phoneInvalid);
    },
  );

  it('should accept a 10 digit phone', () => {
    // Act / Assert
    expect(validatePhone('7711234567')).toBeNull();
  });
});

describe('validateName', () => {
  it.each(['', '   '])('should ask for the name when it is %j', (name) => {
    // Act / Assert
    expect(validateName(name)).toBe(PICKUP_MESSAGES.required);
  });

  it.each(['A', 'x'.repeat(61)])('should refuse a name of the wrong length', (name) => {
    // Act / Assert
    expect(validateName(name)).toBe(PICKUP_MESSAGES.nameLength);
  });

  it('should accept a name between 2 and 60 characters, ignoring the spaces around it', () => {
    // Act / Assert
    expect(validateName('  Ana  ')).toBeNull();
    expect(validateName('x'.repeat(60))).toBeNull();
  });
});

describe('toPhoneDigits', () => {
  it('should keep only the digits, up to 10', () => {
    // Act / Assert
    expect(toPhoneDigits('(771) 123-4567 ext 89')).toBe('7711234567');
  });
});
