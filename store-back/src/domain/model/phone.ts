import { BusinessRuleException } from '../exception/business-rule.exception';

export class Phone {
  private static readonly COUNTRY_CODE = '57';
  private static readonly MOBILE_PATTERN = /^3\d{9}$/;

  private constructor(readonly value: string) {}

  // Acepta "300 123 4567", "+57 300-123-4567", etc. y normaliza al formato de wa.me: 573001234567.
  static create(input: string): Phone {
    const digits = input.replace(/\D/g, '');
    const local =
      digits.length === 12 && digits.startsWith(Phone.COUNTRY_CODE)
        ? digits.slice(Phone.COUNTRY_CODE.length)
        : digits;

    if (!Phone.MOBILE_PATTERN.test(local)) {
      throw new BusinessRuleException(
        'El celular debe ser un número colombiano de 10 dígitos que empiece por 3',
      );
    }
    return new Phone(Phone.COUNTRY_CODE + local);
  }
}
