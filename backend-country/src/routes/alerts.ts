import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

/**
 * GET /api/alerts
 *
 * Query params :
 *   active=true  – retourne uniquement les alertes non résolues (resolvedAt IS NULL)
 */
router.get('/', async (req: Request, res: Response) => {
  const activeOnly = req.query.active === 'true';

  try {
    const alerts = await prisma.alert.findMany({
      where:   activeOnly ? { resolvedAt: null } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: alerts, count: alerts.length });
  } catch (err) {
    console.error('[api] GET /alerts :', err);
    res.status(500).json({ error: 'Erreur interne serveur.' });
  }
});

export default router;
