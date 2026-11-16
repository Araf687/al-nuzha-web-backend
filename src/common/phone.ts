import { BadRequestException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';

// Customer phones are UAE only and always stored as +971XXXXXXXXX.
// National part: mobile 5X XXX XXXX, or landline [2,3,4,6,7,9] XXX XXXX.
const UAE_NATIONAL = /^(5\d{8}|[2-4679]\d{7})$/;

export const UAE_PHONE_ERROR = 'Phone must be a valid UAE number, e.g. +971 50 123 4567 or 050 123 4567';

/**
 * Normalises any common way of typing a UAE number to `+971XXXXXXXXX`:
 * `+971…`, `971…`, `00971…`, `0…` or the bare national number, with spaces,
 * dashes, dots or brackets. Returns null when it is not a valid UAE number.
 */
export function normalizeUaePhone(input?: string | null): string | null {
  if (input == null) return null;
  const compact = String(input).trim().replace(/[\s\-().]/g, '');
  if (!/^\+?\d+$/.test(compact)) return null;
  const d = compact.replace(/^\+/, '');

  const candidates: string[] = [];
  if (d.startsWith('00971')) candidates.push(d.slice(5));
  if (d.startsWith('971')) candidates.push(d.slice(3));
  candidates.push(d);

  for (const c of candidates) {
    // "+971 050…" (country code plus the local trunk 0) is a common slip
    const national = c.replace(/^0/, '');
    if (UAE_NATIONAL.test(national)) return `+971${national}`;
  }
  return null;
}

/** Normalised UAE phone, or a 400 with a clear message. */
export function requireUaePhone(input?: string | null): string {
  if (!input || !String(input).trim()) throw new BadRequestException('Customer phone is required');
  const phone = normalizeUaePhone(input);
  if (!phone) throw new BadRequestException(UAE_PHONE_ERROR);
  return phone;
}

/**
 * Finds the customer with this (normalised) number, also matching rows saved
 * before normalisation existed (`050…`, `971…`, `+971 50 …`), so nobody is added twice.
 * An exact `+971…` match wins over a legacy-format one.
 */
export async function findCustomerByPhone(m: EntityManager, normalized: string): Promise<Customer | null> {
  const national = normalized.replace(/^\+971/, '');
  const rows = await m.createQueryBuilder(Customer, 'c')
    .where(`REGEXP_REPLACE(c.phone, '\\D', '', 'g') IN (:...forms)`, {
      forms: [`971${national}`, `0${national}`, national, `00971${national}`],
    })
    .getMany();
  return rows.find((r) => r.phone === normalized) ?? rows[0] ?? null;
}
