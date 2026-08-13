"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
/**
 * GET /api/measurements
 *
 * Query params :
 *   warehouseId  – filtre par entrepôt (optionnel)
 *   limit        – nombre max de résultats, défaut 100, max 1000
 */
router.get('/', async (req, res) => {
    const rawLimit = req.query.limit;
    const warehouseId = req.query.warehouseId;
    const limit = rawLimit ? Math.min(Math.max(1, parseInt(rawLimit, 10)), 1000) : 100;
    if (isNaN(limit)) {
        res.status(400).json({ error: 'Le paramètre limit doit être un entier.' });
        return;
    }
    try {
        const measurements = await prisma_1.default.measurement.findMany({
            where: warehouseId ? { warehouseId } : undefined,
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
        res.json({ data: measurements, count: measurements.length });
    }
    catch (err) {
        console.error('[api] GET /measurements :', err);
        res.status(500).json({ error: 'Erreur interne serveur.' });
    }
});
exports.default = router;
