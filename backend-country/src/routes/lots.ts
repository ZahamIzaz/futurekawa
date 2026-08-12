import { Router, Request, Response } from 'express';
import { LotStatus } from '@prisma/client';
import prisma from '../prisma';

const router = Router();

const VALID_STATUSES: LotStatus[] = ['COMPLIANT', 'ALERT', 'EXPIRED'];

// ─── Validation ───────────────────────────────────────────────────────────────

interface CreateLotData {
  id?: string;
  warehouseId: string;
  countryCode: string;
  storageDate: Date;
  status: LotStatus;
}

type ValidationResult =
  | { ok: true; data: CreateLotData }
  | { ok: false; error: string };

function validateCreateBody(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Corps de requête JSON invalide.' };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.warehouseId !== 'string' || b.warehouseId.trim() === '') {
    return { ok: false, error: 'warehouseId est requis (chaîne non vide).' };
  }
  if (typeof b.countryCode !== 'string' || b.countryCode.trim() === '') {
    return { ok: false, error: 'countryCode est requis (chaîne non vide).' };
  }
  if (!b.storageDate || isNaN(Date.parse(String(b.storageDate)))) {
    return { ok: false, error: 'storageDate est requis et doit être une date ISO 8601 valide.' };
  }

  let status: LotStatus = 'COMPLIANT';
  if (b.status !== undefined) {
    if (!VALID_STATUSES.includes(b.status as LotStatus)) {
      return {
        ok: false,
        error: `status doit être l'une des valeurs : ${VALID_STATUSES.join(', ')}.`,
      };
    }
    status = b.status as LotStatus;
  }

  const id =
    typeof b.id === 'string' && b.id.trim() !== '' ? b.id.trim() : undefined;

  return {
    ok: true,
    data: {
      id,
      warehouseId: (b.warehouseId as string).trim(),
      countryCode: (b.countryCode as string).trim(),
      storageDate: new Date(String(b.storageDate)),
      status,
    },
  };
}

// ─── POST /api/lots ────────────────────────────────────────────────────────────

router.post('/', async (req: Request, res: Response) => {
  const validation = validateCreateBody(req.body);
  if (!validation.ok) {
    res.status(400).json({ error: validation.error });
    return;
  }

  try {
    const lot = await prisma.lot.create({ data: validation.data });
    res.status(201).json(lot);
  } catch (err: unknown) {
    const prismaError = err as { code?: string };
    if (prismaError.code === 'P2002') {
      res.status(409).json({ error: 'Un lot avec cet identifiant existe déjà.' });
      return;
    }
    console.error('[api] POST /lots :', err);
    res.status(500).json({ error: 'Erreur interne serveur.' });
  }
});

// ─── GET /api/lots ─────────────────────────────────────────────────────────────
// Triés par storageDate ASC = principe FIFO (lot le plus ancien en premier)

router.get('/', async (_req: Request, res: Response) => {
  try {
    const lots = await prisma.lot.findMany({
      orderBy: { storageDate: 'asc' },
    });
    res.json({ data: lots, count: lots.length });
  } catch (err) {
    console.error('[api] GET /lots :', err);
    res.status(500).json({ error: 'Erreur interne serveur.' });
  }
});

// ─── GET /api/lots/:id ─────────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const lot = await prisma.lot.findUnique({ where: { id } });
    if (!lot) {
      res.status(404).json({ error: `Lot « ${id} » introuvable.` });
      return;
    }
    res.json(lot);
  } catch (err) {
    console.error('[api] GET /lots/:id :', err);
    res.status(500).json({ error: 'Erreur interne serveur.' });
  }
});

// ─── GET /api/lots/:id/measurements ───────────────────────────────────────────
// Retourne les mesures du warehouseId du lot, depuis sa storageDate (incluse),
// triées par timestamp croissant.

router.get('/:id/measurements', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const lot = await prisma.lot.findUnique({ where: { id } });
    if (!lot) {
      res.status(404).json({ error: `Lot « ${id} » introuvable.` });
      return;
    }

    const measurements = await prisma.measurement.findMany({
      where: {
        warehouseId: lot.warehouseId,
        timestamp:   { gte: lot.storageDate },
      },
      select: {
        temperature: true,
        humidity:    true,
        timestamp:   true,
      },
      orderBy: { timestamp: 'asc' },
    });

    res.json({
      lotId:       lot.id,
      warehouseId: lot.warehouseId,
      storageDate: lot.storageDate,
      data:        measurements,
      count:       measurements.length,
    });
  } catch (err) {
    console.error('[api] GET /lots/:id/measurements :', err);
    res.status(500).json({ error: 'Erreur interne serveur.' });
  }
});

export default router;
