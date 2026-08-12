import nodemailer from 'nodemailer';
import { AlertType } from '@prisma/client';
import { smtpConfig, MANAGER_EMAILS, COUNTRY_NAMES } from '../config/email';

// ─────────────────────────────────────────────────────────────────────────────
// Payload passé par les services appelants (alertService, lotExpiryService)
// ─────────────────────────────────────────────────────────────────────────────

export interface AlertEmailPayload {
  type:          AlertType;
  countryCode:   string;
  warehouseId:   string;
  measuredValue: number;
  minAllowed:    number;
  maxAllowed:    number;
  createdAt:     Date;
  // Champs spécifiques aux alertes LOT_EXPIRED
  lotId?:        string;
  daysStored?:   number;
  storageDate?:  Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transporter Nodemailer (réutilisé pour toute la durée du processus)
// ─────────────────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host:   smtpConfig.host,
  port:   smtpConfig.port,
  secure: false,  // MailHog ne nécessite pas de TLS
  // Aucune authentification requise avec MailHog
});

// ─────────────────────────────────────────────────────────────────────────────
// Métadonnées d'affichage par type d'alerte
// ─────────────────────────────────────────────────────────────────────────────

const ALERT_META: Partial<Record<AlertType, { label: string; unit: string }>> = {
  TEMPERATURE: { label: 'Température', unit: '°C' },
  HUMIDITY:    { label: 'Humidité',    unit: '%'  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Construction des emails selon le type d'alerte
// ─────────────────────────────────────────────────────────────────────────────

function buildConditionEmail(
  p:           AlertEmailPayload,
  countryName: string,
): { subject: string; text: string } {
  const meta    = ALERT_META[p.type] ?? { label: String(p.type), unit: '' };
  const subject = `[FutureKawa][${countryName}] Alerte ${p.type} - ${p.warehouseId}`;

  const text = `\
FutureKawa – Système d'alertes
═══════════════════════════════════════

Pays              : ${countryName}
Entrepôt          : ${p.warehouseId}
Type d'alerte     : ${p.type}

${meta.label} mesurée  : ${p.measuredValue}${meta.unit}
Plage acceptable  : ${p.minAllowed}${meta.unit} – ${p.maxAllowed}${meta.unit}
Date/Heure        : ${p.createdAt.toISOString()}

Valeur hors plage acceptable détectée.
Une vérification terrain est recommandée.

───────────────────────────────────────
Ce message est généré automatiquement par FutureKawa.`;

  return { subject, text };
}

function buildLotExpiredEmail(
  p:           AlertEmailPayload,
  countryName: string,
): { subject: string; text: string } {
  const subject       = `[FutureKawa][${countryName}] Lot expiré - ${p.lotId ?? ''}`;
  const storageDateStr = p.storageDate
    ? p.storageDate.toISOString().split('T')[0]
    : 'non renseignée';
  const days = p.daysStored ?? p.measuredValue;

  const text = `\
FutureKawa – Système d'alertes
═══════════════════════════════════════

Pays              : ${countryName}
Entrepôt          : ${p.warehouseId}
Identifiant du lot: ${p.lotId ?? 'N/A'}
Date de stockage  : ${storageDateStr}
Jours en stockage : ${days}
Limite autorisée  : ${p.maxAllowed} jours
Date/Heure        : ${p.createdAt.toISOString()}

Ce lot dépasse la durée maximale de stockage autorisée.
Une vérification et/ou priorisation d'expédition est demandée.

───────────────────────────────────────
Ce message est généré automatiquement par FutureKawa.`;

  return { subject, text };
}

// ─────────────────────────────────────────────────────────────────────────────
// Point d'entrée public – ne relance jamais d'erreur
// ─────────────────────────────────────────────────────────────────────────────

export async function sendAlertEmail(payload: AlertEmailPayload): Promise<void> {
  const recipient = MANAGER_EMAILS[payload.countryCode];
  if (!recipient) {
    console.warn(
      `[email] Aucun destinataire configuré pour le pays ${payload.countryCode}, email ignoré.`
    );
    return;
  }

  const countryName = COUNTRY_NAMES[payload.countryCode] ?? payload.countryCode;
  const { subject, text } =
    payload.type === 'LOT_EXPIRED'
      ? buildLotExpiredEmail(payload, countryName)
      : buildConditionEmail(payload, countryName);

  try {
    await transporter.sendMail({
      from:    smtpConfig.from,
      to:      recipient,
      subject,
      text,
    });
    console.log(`[email] Alerte ${payload.type} envoyée à ${recipient}`);
  } catch (err) {
    // L'erreur SMTP ne doit pas faire échouer la persistence de l'alerte
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] Échec envoi ${payload.type} — ${payload.warehouseId} : ${message}`);
  }
}
