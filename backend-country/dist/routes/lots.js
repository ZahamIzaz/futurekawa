"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const lotExpiryService_1 = require("../lotExpiryService");
const router = (0, express_1.Router)();
const VALID_STATUSES = ['COMPLIANT', 'ALERT', 'EXPIRED'];
function validateCreateBody(body) {
    if (typeof body !== 'object' || body === null) {
        return { ok: false, error: 'Corps de requête JSON invalide.' };
    }
    const b = body;
    if (typeof b.warehouseId !== 'string' || b.warehouseId.trim() === '') {
        return { ok: false, error: 'warehouseId est requis (chaîne non vide).' };
    }
    if (typeof b.countryCode !== 'string' || b.countryCode.trim() === '') {
        return { ok: false, error: 'countryCode est requis (chaîne non vide).' };
    }
    if (!b.storageDate || isNaN(Date.parse(String(b.storageDate)))) {
        return { ok: false, error: 'storageDate est requis et doit être une date ISO 8601 valide.' };
    }
    let status = 'COMPLIANT';
    if (b.status !== undefined) {
        if (!VALID_STATUSES.includes(b.status)) {
            return {
                ok: false,
                error: `status doit être l'une des valeurs : ${VALID_STATUSES.join(', ')}.`,
            };
        }
        status = b.status;
    }
    const id = typeof b.id === 'string' && b.id.trim() !== '' ? b.id.trim() : undefined;
    return {
        ok: true,
        data: {
            id,
            warehouseId: b.warehouseId.trim(),
            countryCode: b.countryCode.trim(),
            storageDate: new Date(String(b.storageDate)),
            status,
        },
    };
}
// ─── POST /api/lots ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    const validation = validateCreateBody(req.body);
    if (!validation.ok) {
        res.status(400).json({ error: validation.error });
        return;
    }
    try {
        const lot = await prisma_1.default.lot.create({ data: validation.data });
        res.status(201).json(lot);
    }
    catch (err) {
        const prismaError = err;
        if (prismaError.code === 'P2002') {
            res.status(409).json({ error: 'Un lot avec cet identifiant existe déjà.' });
            return;
        }
        console.error('[api] POST /lots :', err);
        res.status(500).json({ error: 'Erreur interne serveur.' });
    }
});
// ─── POST /api/lots/check-expiry ──────────────────────────────────────────────
// Déclenche manuellement la vérification de péremption (utile pour les tests).
// Note : ce chemin fixe DOIT être défini avant /:id pour éviter tout conflit.
router.post('/check-expiry', async (_req, res) => {
    try {
        const expiredCount = await (0, lotExpiryService_1.checkExpiredLots)();
        res.json({ message: 'Vérification effectuée.', expiredCount });
    }
    catch (err) {
        console.error('[api] POST /lots/check-expiry :', err);
        res.status(500).json({ error: 'Erreur interne serveur.' });
    }
});
// ─── GET /api/lots ─────────────────────────────────────────────────────────────
// Triés par storageDate ASC = principe FIFO (lot le plus ancien en premier)
router.get('/', async (_req, res) => {
    try {
        const lots = await prisma_1.default.lot.findMany({
            orderBy: { storageDate: 'asc' },
        });
        res.json({ data: lots, count: lots.length });
    }
    catch (err) {
        console.error('[api] GET /lots :', err);
        res.status(500).json({ error: 'Erreur interne serveur.' });
    }
});
// ─── GET /api/lots/:id ─────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const lot = await prisma_1.default.lot.findUnique({ where: { id } });
        if (!lot) {
            res.status(404).json({ error: `Lot « ${id} » introuvable.` });
            return;
        }
        res.json(lot);
    }
    catch (err) {
        console.error('[api] GET /lots/:id :', err);
        res.status(500).json({ error: 'Erreur interne serveur.' });
    }
});
// ─── GET /api/lots/:id/measurements ───────────────────────────────────────────
// Retourne les mesures du warehouseId du lot, depuis sa storageDate (incluse),
// triées par timestamp croissant.
router.get('/:id/measurements', async (req, res) => {
    const { id } = req.params;
    try {
        const lot = await prisma_1.default.lot.findUnique({ where: { id } });
        if (!lot) {
            res.status(404).json({ error: `Lot « ${id} » introuvable.` });
            return;
        }
        const measurements = await prisma_1.default.measurement.findMany({
            where: {
                warehouseId: lot.warehouseId,
                timestamp: { gte: lot.storageDate },
            },
            select: {
                temperature: true,
                humidity: true,
                timestamp: true,
            },
            orderBy: { timestamp: 'asc' },
        });
        res.json({
            lotId: lot.id,
            warehouseId: lot.warehouseId,
            storageDate: lot.storageDate,
            data: measurements,
            count: measurements.length,
        });
    }
    catch (err) {
        console.error('[api] GET /lots/:id/measurements :', err);
        res.status(500).json({ error: 'Erreur interne serveur.' });
    }
});
exports.default = router;
