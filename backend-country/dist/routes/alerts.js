"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
/**
 * GET /api/alerts
 *
 * Query params :
 *   active=true  – retourne uniquement les alertes non résolues (resolvedAt IS NULL)
 */
router.get('/', async (req, res) => {
    const activeOnly = req.query.active === 'true';
    try {
        const alerts = await prisma_1.default.alert.findMany({
            where: activeOnly ? { resolvedAt: null } : undefined,
            orderBy: { createdAt: 'desc' },
        });
        res.json({ data: alerts, count: alerts.length });
    }
    catch (err) {
        console.error('[api] GET /alerts :', err);
        res.status(500).json({ error: 'Erreur interne serveur.' });
    }
});
exports.default = router;
