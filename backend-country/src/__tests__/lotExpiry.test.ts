import { describe, it, expect, vi } from 'vitest';

// lotExpiryService importe prisma au niveau module → il faut le mocker
// même si isLotExpired est une fonction pure qui n'utilise pas Prisma
vi.mock('../prisma', () => ({
  default: { lot: {}, alert: {} },
}));
vi.mock('../services/email.service', () => ({
  sendAlertEmail: vi.fn(),
}));

import { isLotExpired } from '../lotExpiryService';

// Date de référence fixe pour tous les tests
const NOW = new Date('2026-08-13T12:00:00.000Z');

// 365 jours exactement avant NOW
const date365 = new Date(NOW.getTime() - 365 * 24 * 60 * 60 * 1000);
// 366 jours avant NOW
const date366 = new Date(NOW.getTime() - 366 * 24 * 60 * 60 * 1000);
// 364 jours avant NOW
const date364 = new Date(NOW.getTime() - 364 * 24 * 60 * 60 * 1000);

// ─── A3 : isLotExpired – règle strictement > 365 jours ───────────────────────
describe('isLotExpired', () => {
  it('A3a – 366 jours : lot expiré', () => {
    expect(isLotExpired(date366, NOW)).toBe(true);
  });

  it('A3b – 365 jours exactement : non expiré (limite non inclusive)', () => {
    expect(isLotExpired(date365, NOW)).toBe(false);
  });

  it('A3c – 364 jours : non expiré', () => {
    expect(isLotExpired(date364, NOW)).toBe(false);
  });

  it('A3d – storageDate = now : non expiré', () => {
    expect(isLotExpired(NOW, NOW)).toBe(false);
  });
});
