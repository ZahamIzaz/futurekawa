import type { Country, Lot, Measurement, Alert } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Erreur HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchCountries(): Promise<Country[]> {
  const res = await get<{ data: Country[] }>('/api/countries');
  return res.data;
}

export async function fetchLots(countryCode: string): Promise<Lot[]> {
  const res = await get<{ data: Lot[] }>(`/api/countries/${countryCode}/lots`);
  return res.data;
}

export async function fetchLot(countryCode: string, lotId: string): Promise<Lot> {
  return get<Lot>(`/api/countries/${countryCode}/lots/${encodeURIComponent(lotId)}`);
}

export async function fetchMeasurements(
  countryCode: string,
  lotId:       string,
): Promise<Measurement[]> {
  const res = await get<{ data: Measurement[] }>(
    `/api/countries/${countryCode}/lots/${encodeURIComponent(lotId)}/measurements`
  );
  return res.data;
}

export async function fetchAlerts(
  countryCode: string,
  activeOnly  = true,
): Promise<Alert[]> {
  const qs  = activeOnly ? '?active=true' : '';
  const res = await get<{ data: Alert[] }>(`/api/countries/${countryCode}/alerts${qs}`);
  return res.data;
}
