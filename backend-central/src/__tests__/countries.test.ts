import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ─── Mock httpClient ──────────────────────────────────────────────────────────
// Les classes d'erreur sont définies DANS la factory pour éviter les problèmes
// de hoisting avec vi.mock

vi.mock('../httpClient', () => {
  class BackendUnavailableError extends Error {
    constructor(url: string) {
      super(`Backend indisponible : ${url}`);
      this.name = 'BackendUnavailableError';
    }
  }
  class BackendHttpError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown) {
      super(`HTTP ${status}`);
      this.name = 'BackendHttpError';
      this.status = status;
      this.body = body;
    }
  }
  return {
    BackendUnavailableError,
    BackendHttpError,
    httpGet: vi.fn(),
    httpPost: vi.fn(),
  };
});

import app from '../app';
import { httpGet, httpPost, BackendUnavailableError, BackendHttpError } from '../httpClient';

const mockHttpGet = httpGet as ReturnType<typeof vi.fn>;
const mockHttpPost = httpPost as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── E1 : GET /api/countries ─────────────────────────────────────────────────
describe('GET /api/countries', () => {
  it('E1 – retourne la liste des pays avec data', async () => {
    const res = await request(app).get('/api/countries');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    const bra = res.body.data.find((c: any) => c.code === 'BRA');
    expect(bra).toBeDefined();
    expect(bra.name).toBe('Brésil');
  });
});

// ─── E2 : GET /api/countries/:countryCode/lots – proxy réussi ─────────────────
describe('GET /api/countries/BRA/lots', () => {
  it('E2 – proxifie vers le backend pays et retourne le résultat', async () => {
    const fakeLots = { data: [{ id: 'lot-001', warehouseId: 'WH-BRA-01' }], count: 1 };
    mockHttpGet.mockResolvedValue(fakeLots);

    const res = await request(app).get('/api/countries/BRA/lots');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(mockHttpGet).toHaveBeenCalledWith(expect.stringContaining('/api/lots'));
  });
});

// ─── E3 : GET /api/countries/:countryCode/lots – backend indisponible ─────────
describe('GET /api/countries/BRA/lots – backend indisponible', () => {
  it('E3 – retourne 503 si BackendUnavailableError', async () => {
    mockHttpGet.mockRejectedValue(new BackendUnavailableError('http://backend-country:3001/api/lots'));

    const res = await request(app).get('/api/countries/BRA/lots');

    expect(res.status).toBe(503);
    expect(res.body.error).toContain('indisponible');
    expect(res.body.countryCode).toBe('BRA');
  });
});

// ─── E4 : GET /api/countries/XXX/lots – pays non configuré ────────────────────
describe('GET /api/countries/XXX/lots – pays inconnu', () => {
  it('E4 – retourne 404 pour un pays non configuré', async () => {
    const res = await request(app).get('/api/countries/XXX/lots');

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('non configuré');
  });
});

// ─── E5 : GET /api/countries/BRA/lots/:lotId ──────────────────────────────────
describe('GET /api/countries/BRA/lots/lot-001', () => {
  it('E5 – proxifie vers /api/lots/:lotId', async () => {
    const fakeLot = { id: 'lot-001', warehouseId: 'WH-BRA-01', status: 'COMPLIANT' };
    mockHttpGet.mockResolvedValue(fakeLot);

    const res = await request(app).get('/api/countries/BRA/lots/lot-001');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('lot-001');
    expect(mockHttpGet).toHaveBeenCalledWith(expect.stringContaining('/api/lots/lot-001'));
  });

  it('E6 – transmet le 404 du backend pays si lot introuvable', async () => {
    mockHttpGet.mockRejectedValue(new BackendHttpError(404, { error: 'Lot introuvable' }));

    const res = await request(app).get('/api/countries/BRA/lots/unknown');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Lot introuvable');
  });
});

// ─── E7 : GET /api/countries/BRA/lots/:lotId/measurements ────────────────────
describe('GET /api/countries/BRA/lots/lot-001/measurements', () => {
  it('E7 – proxifie vers /api/lots/:lotId/measurements', async () => {
    const fakeMeasurements = { lotId: 'lot-001', warehouseId: 'WH-BRA-01', storageDate: '2025-01-01', data: [], count: 0 };
    mockHttpGet.mockResolvedValue(fakeMeasurements);

    const res = await request(app).get('/api/countries/BRA/lots/lot-001/measurements');

    expect(res.status).toBe(200);
    expect(res.body.lotId).toBe('lot-001');
    expect(mockHttpGet).toHaveBeenCalledWith(expect.stringContaining('/measurements'));
  });
});

// ─── E8 : GET /api/countries/BRA/alerts ──────────────────────────────────────
describe('GET /api/countries/BRA/alerts', () => {
  it('E8 – proxifie vers /api/alerts', async () => {
    const fakeAlerts = [{ id: 'alert-1', type: 'TEMPERATURE' }];
    mockHttpGet.mockResolvedValue(fakeAlerts);

    const res = await request(app).get('/api/countries/BRA/alerts');

    expect(res.status).toBe(200);
    expect(mockHttpGet).toHaveBeenCalledWith(expect.stringContaining('/api/alerts'));
  });
});

// ─── E9 : POST /api/countries/BRA/lots ───────────────────────────────────────
describe('POST /api/countries/BRA/lots', () => {
  it('E9 – proxifie la création de lot et retourne 201', async () => {
    const newLot = { id: 'lot-new', warehouseId: 'WH-BRA-01', countryCode: 'BRA', status: 'COMPLIANT' };
    mockHttpPost.mockResolvedValue(newLot);

    const res = await request(app)
      .post('/api/countries/BRA/lots')
      .send({ warehouseId: 'WH-BRA-01', countryCode: 'BRA', storageDate: '2025-01-01T00:00:00.000Z' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('lot-new');
    expect(mockHttpPost).toHaveBeenCalledWith(
      expect.stringContaining('/api/lots'),
      expect.objectContaining({ warehouseId: 'WH-BRA-01' }),
    );
  });
});

// ─── E8b : GET /api/countries/BRA/alerts?active=true – transmission du param ──
describe('GET /api/countries/BRA/alerts?active=true', () => {
  it('E8b – transmet active=true dans l\'URL envoyée au backend pays', async () => {
    mockHttpGet.mockResolvedValue([]);

    const res = await request(app).get('/api/countries/BRA/alerts?active=true');

    expect(res.status).toBe(200);
    expect(mockHttpGet).toHaveBeenCalledWith(
      expect.stringContaining('active=true'),
    );
  });

  it('E8c – sans active=true, ne transmet pas le paramètre', async () => {
    mockHttpGet.mockResolvedValue([]);

    await request(app).get('/api/countries/BRA/alerts');

    const calledUrl: string = mockHttpGet.mock.calls[0][0];
    expect(calledUrl).not.toContain('active=true');
  });
});

// ─── GET /health ──────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('retourne 200 avec status ok et service backend-central', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('backend-central');
  });
});
