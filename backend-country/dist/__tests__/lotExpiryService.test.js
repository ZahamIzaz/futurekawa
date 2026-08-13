"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ─── Mocks ────────────────────────────────────────────────────────────────────
vitest_1.vi.mock('../prisma', () => ({
    default: {
        lot: {
            findMany: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
        },
        alert: {
            findFirst: vitest_1.vi.fn(),
            create: vitest_1.vi.fn(),
        },
    },
}));
// Empêche toute tentative de connexion réelle à mailhog
vitest_1.vi.mock('../services/email.service', () => ({
    sendAlertEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
const lotExpiryService_1 = require("../lotExpiryService");
const prisma_1 = __importDefault(require("../prisma"));
const mockPrisma = prisma_1.default;
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.useRealTimers();
    vitest_1.vi.clearAllMocks();
});
// ─── C6 : checkExpiredLots – fake timers ─────────────────────────────────────
(0, vitest_1.describe)('checkExpiredLots', () => {
    (0, vitest_1.it)('C6a – retourne 0 quand aucun lot expiré', async () => {
        vitest_1.vi.useFakeTimers({ toFake: ['Date'] });
        vitest_1.vi.setSystemTime(new Date('2026-08-13T12:00:00.000Z'));
        mockPrisma.lot.findMany.mockResolvedValue([]);
        const count = await (0, lotExpiryService_1.checkExpiredLots)();
        (0, vitest_1.expect)(count).toBe(0);
        (0, vitest_1.expect)(mockPrisma.lot.update).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('C6b – marque un lot expiré et crée une alerte LOT_EXPIRED', async () => {
        vitest_1.vi.useFakeTimers({ toFake: ['Date'] });
        const now = new Date('2026-08-13T12:00:00.000Z');
        vitest_1.vi.setSystemTime(now);
        const expiredLot = {
            id: 'lot-old',
            warehouseId: 'WH-BRA-01',
            countryCode: 'BRA',
            storageDate: new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000),
            status: 'COMPLIANT',
        };
        mockPrisma.lot.findMany.mockResolvedValue([expiredLot]);
        mockPrisma.lot.update.mockResolvedValue({});
        mockPrisma.alert.findFirst.mockResolvedValue(null);
        mockPrisma.alert.create.mockResolvedValue({});
        const count = await (0, lotExpiryService_1.checkExpiredLots)();
        (0, vitest_1.expect)(count).toBe(1);
        (0, vitest_1.expect)(mockPrisma.lot.update).toHaveBeenCalledWith({
            where: { id: 'lot-old' },
            data: { status: 'EXPIRED' },
        });
        (0, vitest_1.expect)(mockPrisma.alert.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ data: vitest_1.expect.objectContaining({ type: 'LOT_EXPIRED' }) }));
    });
    (0, vitest_1.it)('C6c – ne crée pas de doublon si alerte LOT_EXPIRED existe déjà', async () => {
        vitest_1.vi.useFakeTimers({ toFake: ['Date'] });
        const now = new Date('2026-08-13T12:00:00.000Z');
        vitest_1.vi.setSystemTime(now);
        const expiredLot = {
            id: 'lot-old-2',
            warehouseId: 'WH-BRA-01',
            countryCode: 'BRA',
            storageDate: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000),
            status: 'COMPLIANT',
        };
        mockPrisma.lot.findMany.mockResolvedValue([expiredLot]);
        mockPrisma.lot.update.mockResolvedValue({});
        mockPrisma.alert.findFirst.mockResolvedValue({ id: 'alert-existing' });
        const count = await (0, lotExpiryService_1.checkExpiredLots)();
        // L'alerte existe déjà → newlyExpiredCount reste 0 (pas de nouvelle alerte)
        (0, vitest_1.expect)(count).toBe(0);
        (0, vitest_1.expect)(mockPrisma.alert.create).not.toHaveBeenCalled();
        // Le statut du lot est quand même mis à jour
        (0, vitest_1.expect)(mockPrisma.lot.update).toHaveBeenCalledWith({
            where: { id: 'lot-old-2' },
            data: { status: 'EXPIRED' },
        });
    });
});
