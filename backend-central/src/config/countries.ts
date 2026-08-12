// ─────────────────────────────────────────────────────────────────────────────
// Configuration centralisée des backends pays
//
// Pour ajouter un pays, décommenter l'entrée correspondante et définir
// la variable d'environnement associée dans docker-compose / .env.
// ─────────────────────────────────────────────────────────────────────────────

export interface CountryConfig {
  code:       string;
  name:       string;
  backendUrl: string | undefined;
}

export const COUNTRIES: CountryConfig[] = [
  {
    code:       'BRA',
    name:       'Brésil',
    backendUrl: process.env.BRAZIL_BACKEND_URL ?? 'http://backend-country:3001',
  },
  // { code: 'ECU', name: 'Équateur',  backendUrl: process.env.ECUADOR_BACKEND_URL },
  // { code: 'COL', name: 'Colombie',  backendUrl: process.env.COLOMBIA_BACKEND_URL },
];

export function getCountry(code: string): CountryConfig | undefined {
  return COUNTRIES.find((c) => c.code === code);
}
