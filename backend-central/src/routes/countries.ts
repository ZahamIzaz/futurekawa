import { Router, Request, Response } from 'express';
import { COUNTRIES, getCountry } from '../config/countries';
import { httpGet, BackendUnavailableError, BackendHttpError } from '../httpClient';

const router = Router();

// ─── Helper : résout le pays ou retourne 404 ──────────────────────────────────

function resolveCountryUrl(countryCode: string, res: Response): string | null {
  const country = getCountry(countryCode);
  if (!country?.backendUrl) {
    res.status(404).json({ error: 'Pays non configuré' });
    return null;
  }
  return country.backendUrl;
}

// ─── Helper : proxy GET avec gestion d'erreurs uniforme ───────────────────────

async function proxyGet(
  res:         Response,
  backendUrl:  string,
  path:        string,
  countryCode: string,
): Promise<void> {
  const url = `${backendUrl}${path}`;
  console.log(`[proxy] GET ${url}`);

  try {
    const data = await httpGet(url);
    res.json(data);
  } catch (err) {
    if (err instanceof BackendUnavailableError) {
      console.error(`[proxy] Backend pays indisponible — ${countryCode} : ${url}`);
      res.status(503).json({ error: 'Backend pays indisponible', countryCode });
    } else if (err instanceof BackendHttpError) {
      // Transmettre le code HTTP et le corps d'erreur tels quels (ex : 404 lot introuvable)
      res.status(err.status).json(err.body);
    } else {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[proxy] Erreur inattendue : ${message}`);
      res.status(500).json({ error: 'Erreur interne serveur.' });
    }
  }
}

// ─── GET /api/countries ───────────────────────────────────────────────────────

router.get('/', (_req: Request, res: Response) => {
  const data = COUNTRIES.map(({ code, name }) => ({ code, name }));
  res.json({ data });
});

// ─── GET /api/countries/:countryCode/lots ─────────────────────────────────────

router.get('/:countryCode/lots', async (req: Request, res: Response) => {
  const { countryCode } = req.params;
  const backendUrl = resolveCountryUrl(countryCode, res);
  if (!backendUrl) return;
  await proxyGet(res, backendUrl, '/api/lots', countryCode);
});

// ─── GET /api/countries/:countryCode/lots/:lotId/measurements ─────────────────
// Déclaré AVANT /:lotId pour que Express ne l'intercepte pas

router.get('/:countryCode/lots/:lotId/measurements', async (req: Request, res: Response) => {
  const { countryCode, lotId } = req.params;
  const backendUrl = resolveCountryUrl(countryCode, res);
  if (!backendUrl) return;
  await proxyGet(
    res,
    backendUrl,
    `/api/lots/${encodeURIComponent(lotId)}/measurements`,
    countryCode,
  );
});

// ─── GET /api/countries/:countryCode/lots/:lotId ──────────────────────────────

router.get('/:countryCode/lots/:lotId', async (req: Request, res: Response) => {
  const { countryCode, lotId } = req.params;
  const backendUrl = resolveCountryUrl(countryCode, res);
  if (!backendUrl) return;
  await proxyGet(
    res,
    backendUrl,
    `/api/lots/${encodeURIComponent(lotId)}`,
    countryCode,
  );
});

// ─── GET /api/countries/:countryCode/alerts[?active=true] ────────────────────

router.get('/:countryCode/alerts', async (req: Request, res: Response) => {
  const { countryCode } = req.params;
  const backendUrl = resolveCountryUrl(countryCode, res);
  if (!backendUrl) return;
  const qs = req.query.active === 'true' ? '?active=true' : '';
  await proxyGet(res, backendUrl, `/api/alerts${qs}`, countryCode);
});

export default router;
