"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
// Mock Prisma avant d'importer app
vitest_1.vi.mock('../prisma', () => ({
    default: {
        lot: {
            create: vitest_1.vi.fn(),
            findMany: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
        },
        measurement: {
            findMany: vitest_1.vi.fn(),
        },
    },
}));
// Mock lotExpiryService pour éviter les effets de bord
vitest_1.vi.mock('../lotExpiryService', () => ({
    checkExpiredLots: vitest_1.vi.fn().mockResolvedValue(0),
    isLotExpired: vitest_1.vi.fn(),
}));
const app_1 = __importDefault(require("../app"));
const prisma_1 = __importDefault(require("../prisma"));
const mockPrisma = prisma_1.default;
const sampleLot = {
    id: 'lot-001',
    warehouseId: 'WH-BRA-01',
    countryCode: 'BRA',
    storageDate: new Date('2025-01-01T00:00:00.000Z').toISOString(),
    status: 'COMPLIANT',
    createdAt: new Date().toISOString(),
};
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
});
// ─── B1 : POST /api/lots – création réussie ───────────────────────────────────
(0, vitest_1.describe)('POST /api/lots', () => {
    (0, vitest_1.it)('B1 – crée un lot et retourne 201 avec le lot', async () => {
        mockPrisma.lot.create.mockResolvedValue(sampleLot);
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/lots')
            .send({ warehouseId: 'WH-BRA-01', countryCode: 'BRA', storageDate: '2025-01-01T00:00:00.000Z' });
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body.id).toBe('lot-001');
        (0, vitest_1.expect)(res.body.warehouseId).toBe('WH-BRA-01');
    });
    (0, vitest_1.it)('B2 – retourne 400 si warehouseId manquant', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/lots')
            .send({ countryCode: 'BRA', storageDate: '2025-01-01T00:00:00.000Z' });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.error).toMatch(/warehouseId/);
    });
    (0, vitest_1.it)('B3 – retourne 400 si storageDate invalide', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/lots')
            .send({ warehouseId: 'WH-BRA-01', countryCode: 'BRA', storageDate: 'not-a-date' });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body.error).toMatch(/storageDate/);
    });
    (0, vitest_1.it)('B4 – retourne 409 si lot dupliqué (code P2002)', async () => {
        const p2002 = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
        mockPrisma.lot.create.mockRejectedValue(p2002);
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/lots')
            .send({ warehouseId: 'WH-BRA-01', countryCode: 'BRA', storageDate: '2025-01-01T00:00:00.000Z' });
        (0, vitest_1.expect)(res.status).toBe(409);
    });
});
// ─── B5 : GET /api/lots ───────────────────────────────────────────────────────
(0, vitest_1.describe)('GET /api/lots', () => {
    (0, vitest_1.it)('B5 – retourne la liste avec data et count', async () => {
        mockPrisma.lot.findMany.mockResolvedValue([sampleLot]);
        const res = await (0, supertest_1.default)(app_1.default).get('/api/lots');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.count).toBe(1);
        (0, vitest_1.expect)(res.body.data).toHaveLength(1);
        (0, vitest_1.expect)(res.body.data[0].id).toBe('lot-001');
    });
});
// ─── GET /api/lots/:id ────────────────────────────────────────────────────────
(0, vitest_1.describe)('GET /api/lots/:id', () => {
    (0, vitest_1.it)('retourne 200 avec le lot si trouvé', async () => {
        mockPrisma.lot.findUnique.mockResolvedValue(sampleLot);
        const res = await (0, supertest_1.default)(app_1.default).get('/api/lots/lot-001');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.id).toBe('lot-001');
    });
    (0, vitest_1.it)('retourne 404 si lot non trouvé', async () => {
        mockPrisma.lot.findUnique.mockResolvedValue(null);
        const res = await (0, supertest_1.default)(app_1.default).get('/api/lots/unknown');
        (0, vitest_1.expect)(res.status).toBe(404);
    });
});
// ─── GET /api/lots/:id/measurements ───────────────────────────────────────────
(0, vitest_1.describe)('GET /api/lots/:id/measurements', () => {
    (0, vitest_1.it)('retourne les mesures du lot avec structure complète', async () => {
        mockPrisma.lot.findUnique.mockResolvedValue(sampleLot);
        mockPrisma.measurement.findMany.mockResolvedValue([
            { temperature: 28.5, humidity: 55.0, timestamp: '2025-01-02T10:00:00.000Z' },
        ]);
        const res = await (0, supertest_1.default)(app_1.default).get('/api/lots/lot-001/measurements');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.lotId).toBe('lot-001');
        (0, vitest_1.expect)(res.body.warehouseId).toBe('WH-BRA-01');
        (0, vitest_1.expect)(res.body.count).toBe(1);
        (0, vitest_1.expect)(res.body.data).toHaveLength(1);
    });
    (0, vitest_1.it)('retourne 404 si lot non trouvé', async () => {
        mockPrisma.lot.findUnique.mockResolvedValue(null);
        const res = await (0, supertest_1.default)(app_1.default).get('/api/lots/unknown/measurements');
        (0, vitest_1.expect)(res.status).toBe(404);
    });
});
// ─── POST /api/lots/check-expiry ──────────────────────────────────────────────
(0, vitest_1.describe)('POST /api/lots/check-expiry', () => {
    (0, vitest_1.it)('appelle checkExpiredLots et retourne expiredCount', async () => {
        const { checkExpiredLots } = await Promise.resolve().then(() => __importStar(require('../lotExpiryService')));
        checkExpiredLots.mockResolvedValue(3);
        const res = await (0, supertest_1.default)(app_1.default).post('/api/lots/check-expiry');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.expiredCount).toBe(3);
    });
});
// ─── GET /health ──────────────────────────────────────────────────────────────
(0, vitest_1.describe)('GET /health', () => {
    (0, vitest_1.it)('retourne 200 avec status ok et service backend-country', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/health');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.status).toBe('ok');
        (0, vitest_1.expect)(res.body.service).toBe('backend-country');
    });
});
