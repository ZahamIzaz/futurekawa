// ─────────────────────────────────────────────────────────────────────────────
// Client HTTP interne – proxy vers les backends pays
//
// Lève BackendUnavailableError  si le backend est injoignable ou timeout
// Lève BackendHttpError          si le backend répond avec un code d'erreur HTTP
// ─────────────────────────────────────────────────────────────────────────────

const TIMEOUT_MS = Number(process.env.HTTP_TIMEOUT_MS ?? 5000);

// ─── Erreurs typées ───────────────────────────────────────────────────────────

export class BackendUnavailableError extends Error {
  constructor(url: string) {
    super(`Backend indisponible : ${url}`);
    this.name = 'BackendUnavailableError';
  }
}

export class BackendHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body:   unknown,
  ) {
    super(`HTTP ${status}`);
    this.name = 'BackendHttpError';
  }
}

// ─── Requête GET avec timeout ─────────────────────────────────────────────────

export async function httpGet<T = unknown>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data: unknown = await response.json();

    if (!response.ok) {
      throw new BackendHttpError(response.status, data);
    }

    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof BackendHttpError) throw err;

    // AbortError (timeout) ou TypeError (réseau indisponible, ECONNREFUSED…)
    throw new BackendUnavailableError(url);
  }
}

// ─── Requête POST avec timeout ────────────────────────────────────────────────

export async function httpPost<T = unknown>(url: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });
    clearTimeout(timeoutId);

    const data: unknown = await response.json();

    if (!response.ok) {
      throw new BackendHttpError(response.status, data);
    }

    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof BackendHttpError) throw err;

    throw new BackendUnavailableError(url);
  }
}
