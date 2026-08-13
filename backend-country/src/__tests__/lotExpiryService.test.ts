import { describe, it, expect, vi, afterEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../prisma', () => ({
  default: {
    lot: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    alert: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Empêche toute tentative de connexion réelle à mailhog
vi.mock('../services/email.service', () => ({
  sendAlertEmail: vi.fn().mockResolvedValue(undefined),
}));

import { checkExpiredLots } from '../lotExpiryService';
import prisma from '../prisma';

const mockPrisma = prisma as unknown as {
  lot: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  alert: { findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
};

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ─── C6 : checkExpiredLots – fake timers ─────────────────────────────────────
describe('checkExpiredLots', () => {
  it('C6a – retourne 0 quand aucun lot expiré', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-08-13T12:00:00.000Z'));

    mockPrisma.lot.findMany.mockResolvedValue([]);

    const count = await checkExpiredLots();

    expect(count).toBe(0);
    expect(mockPrisma.lot.update).not.toHaveBeenCalled();
  });

  it('C6b – marque un lot expiré et crée une alerte LOT_EXPIRED', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const now = new Date('2026-08-13T12:00:00.000Z');
    vi.setSystemTime(now);

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

    const count = await checkExpiredLots();

    expect(count).toBe(1);
    expect(mockPrisma.lot.update).toHaveBeenCalledWith({
      where: { id: 'lot-old' },
      data: { status: 'EXPIRED' },
    });
    expect(mockPrisma.alert.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'LOT_EXPIRED' }) })
    );
  });

  it('C6c – ne crée pas de doublon si alerte LOT_EXPIRED existe déjà', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const now = new Date('2026-08-13T12:00:00.000Z');
    vi.setSystemTime(now);

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

    const count = await checkExpiredLots();

    // L'alerte existe déjà → newlyExpiredCount reste 0 (pas de nouvelle alerte)
    expect(count).toBe(0);
    expect(mockPrisma.alert.create).not.toHaveBeenCalled();
    // Le statut du lot est quand même mis à jour
    expect(mockPrisma.lot.update).toHaveBeenCalledWith({
      where: { id: 'lot-old-2' },
      data: { status: 'EXPIRED' },
    });
  });
});
