"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// lotExpiryService importe prisma au niveau module → il faut le mocker
// même si isLotExpired est une fonction pure qui n'utilise pas Prisma
vitest_1.vi.mock('../prisma', () => ({
    default: { lot: {}, alert: {} },
}));
vitest_1.vi.mock('../services/email.service', () => ({
    sendAlertEmail: vitest_1.vi.fn(),
}));
const lotExpiryService_1 = require("../lotExpiryService");
// Date de référence fixe pour tous les tests
const NOW = new Date('2026-08-13T12:00:00.000Z');
// 365 jours exactement avant NOW
const date365 = new Date(NOW.getTime() - 365 * 24 * 60 * 60 * 1000);
// 366 jours avant NOW
const date366 = new Date(NOW.getTime() - 366 * 24 * 60 * 60 * 1000);
// 364 jours avant NOW
const date364 = new Date(NOW.getTime() - 364 * 24 * 60 * 60 * 1000);
// ─── A3 : isLotExpired – règle strictement > 365 jours ───────────────────────
(0, vitest_1.describe)('isLotExpired', () => {
    (0, vitest_1.it)('A3a – 366 jours : lot expiré', () => {
        (0, vitest_1.expect)((0, lotExpiryService_1.isLotExpired)(date366, NOW)).toBe(true);
    });
    (0, vitest_1.it)('A3b – 365 jours exactement : non expiré (limite non inclusive)', () => {
        (0, vitest_1.expect)((0, lotExpiryService_1.isLotExpired)(date365, NOW)).toBe(false);
    });
    (0, vitest_1.it)('A3c – 364 jours : non expiré', () => {
        (0, vitest_1.expect)((0, lotExpiryService_1.isLotExpired)(date364, NOW)).toBe(false);
    });
    (0, vitest_1.it)('A3d – storageDate = now : non expiré', () => {
        (0, vitest_1.expect)((0, lotExpiryService_1.isLotExpired)(NOW, NOW)).toBe(false);
    });
});
