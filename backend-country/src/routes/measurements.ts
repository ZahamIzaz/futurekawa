import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

/**
 * GET /api/measurements
 *
 * Query params :
 *   warehouseId  – filtre par entrepôt (optionnel)
 *   limit        – nombre max de résultats, défaut 100, max 1000
 */
router.get('/', async (req: Request, res: Response) => {
  const rawLimit    = req.query.limit as string | undefined;
  const warehouseId = req.query.warehouseId as string | undefined;

  const limit = rawLimit ? Math.min(Math.max(1, parseInt(rawLimit, 10)), 1000) : 100;

  if (isNaN(limit)) {
    res.status(400).json({ error: 'Le paramètre limit doit être un entier.' });
    return;
  }

  try {
    const measurements = await prisma.measurement.findMany({
      where:   warehouseId ? { warehouseId } : undefined,
      orderBy: { timestamp: 'desc' },
      take:    limit,
    });

    res.json({ data: measurements, count: measurements.length });
  } catch (err) {
    console.error('[api] GET /measurements :', err);
    res.status(500).json({ error: 'Erreur interne serveur.' });
  }
});

export default router;
