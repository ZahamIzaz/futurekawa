import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock Prisma avant d'importer app
vi.mock('../prisma', () => ({
  default: {
    lot: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    measurement: {
      findMany: vi.fn(),
    },
  },
}));

// Mock lotExpiryService pour éviter les effets de bord
vi.mock('../lotExpiryService', () => ({
  checkExpiredLots: vi.fn().mockResolvedValue(0),
  isLotExpired: vi.fn(),
}));

import app from '../app';
import prisma from '../prisma';

const mockPrisma = prisma as unknown as {
  lot: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  measurement: { findMany: ReturnType<typeof vi.fn> };
};

const sampleLot = {
  id: 'lot-001',
  warehouseId: 'WH-BRA-01',
  countryCode: 'BRA',
  storageDate: new Date('2025-01-01T00:00:00.000Z').toISOString(),
  status: 'COMPLIANT',
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── B1 : POST /api/lots – création réussie ───────────────────────────────────
describe('POST /api/lots', () => {
  it('B1 – crée un lot et retourne 201 avec le lot', async () => {
    mockPrisma.lot.create.mockResolvedValue(sampleLot);

    const res = await request(app)
      .post('/api/lots')
      .send({ warehouseId: 'WH-BRA-01', countryCode: 'BRA', storageDate: '2025-01-01T00:00:00.000Z' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('lot-001');
    expect(res.body.warehouseId).toBe('WH-BRA-01');
  });

  it('B2 – retourne 400 si warehouseId manquant', async () => {
    const res = await request(app)
      .post('/api/lots')
      .send({ countryCode: 'BRA', storageDate: '2025-01-01T00:00:00.000Z' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/warehouseId/);
  });

  it('B3 – retourne 400 si storageDate invalide', async () => {
    const res = await request(app)
      .post('/api/lots')
      .send({ warehouseId: 'WH-BRA-01', countryCode: 'BRA', storageDate: 'not-a-date' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/storageDate/);
  });

  it('B4 – retourne 409 si lot dupliqué (code P2002)', async () => {
    const p2002 = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
    mockPrisma.lot.create.mockRejectedValue(p2002);

    const res = await request(app)
      .post('/api/lots')
      .send({ warehouseId: 'WH-BRA-01', countryCode: 'BRA', storageDate: '2025-01-01T00:00:00.000Z' });

    expect(res.status).toBe(409);
  });
});

// ─── B5 : GET /api/lots ───────────────────────────────────────────────────────
describe('GET /api/lots', () => {
  it('B5 – retourne la liste avec data et count', async () => {
    mockPrisma.lot.findMany.mockResolvedValue([sampleLot]);

    const res = await request(app).get('/api/lots');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe('lot-001');
  });
});

// ─── GET /api/lots/:id ────────────────────────────────────────────────────────
describe('GET /api/lots/:id', () => {
  it('retourne 200 avec le lot si trouvé', async () => {
    mockPrisma.lot.findUnique.mockResolvedValue(sampleLot);

    const res = await request(app).get('/api/lots/lot-001');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('lot-001');
  });

  it('retourne 404 si lot non trouvé', async () => {
    mockPrisma.lot.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/lots/unknown');

    expect(res.status).toBe(404);
  });
});

// ─── GET /api/lots/:id/measurements ───────────────────────────────────────────
describe('GET /api/lots/:id/measurements', () => {
  it('retourne les mesures du lot avec structure complète', async () => {
    mockPrisma.lot.findUnique.mockResolvedValue(sampleLot);
    mockPrisma.measurement.findMany.mockResolvedValue([
      { temperature: 28.5, humidity: 55.0, timestamp: '2025-01-02T10:00:00.000Z' },
    ]);

    const res = await request(app).get('/api/lots/lot-001/measurements');

    expect(res.status).toBe(200);
    expect(res.body.lotId).toBe('lot-001');
    expect(res.body.warehouseId).toBe('WH-BRA-01');
    expect(res.body.count).toBe(1);
    expect(res.body.data).toHaveLength(1);
  });

  it('retourne 404 si lot non trouvé', async () => {
    mockPrisma.lot.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/lots/unknown/measurements');

    expect(res.status).toBe(404);
  });
});

// ─── POST /api/lots/check-expiry ──────────────────────────────────────────────
describe('POST /api/lots/check-expiry', () => {
  it('appelle checkExpiredLots et retourne expiredCount', async () => {
    const { checkExpiredLots } = await import('../lotExpiryService');
    (checkExpiredLots as ReturnType<typeof vi.fn>).mockResolvedValue(3);

    const res = await request(app).post('/api/lots/check-expiry');

    expect(res.status).toBe(200);
    expect(res.body.expiredCount).toBe(3);
  });
});

// ─── GET /health ──────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('retourne 200 avec status ok et service backend-country', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('backend-country');
  });
});
