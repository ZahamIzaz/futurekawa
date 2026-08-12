// ─────────────────────────────────────────────────────────────────────────────
// Configuration email centralisée
//
// Pour ajouter un pays, ajouter l'entrée dans MANAGER_EMAILS et définir
// la variable d'environnement correspondante dans docker-compose / .env.
// ─────────────────────────────────────────────────────────────────────────────

export const smtpConfig = {
  host:  process.env.SMTP_HOST ?? 'mailhog',
  port:  Number(process.env.SMTP_PORT ?? 1025),
  from:  process.env.MAIL_FROM ?? 'alerts@futurekawa.local',
};

/** Email du responsable d'exploitation, indexé par countryCode ISO alpha-3 */
export const MANAGER_EMAILS: Record<string, string | undefined> = {
  BRA: process.env.BRAZIL_MANAGER_EMAIL   ?? 'responsable.bresil@futurekawa.local',
  // ECU: process.env.ECUADOR_MANAGER_EMAIL  ?? 'responsable.equateur@futurekawa.local',
  // COL: process.env.COLOMBIA_MANAGER_EMAIL ?? 'responsable.colombie@futurekawa.local',
};

/** Nom lisible du pays pour les emails */
export const COUNTRY_NAMES: Record<string, string> = {
  BRA: 'Brésil',
  ECU: 'Équateur',
  COL: 'Colombie',
};
