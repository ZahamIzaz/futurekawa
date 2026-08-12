import { AlertType } from '@prisma/client';
import prisma from './prisma';
import { COUNTRY_THRESHOLDS, getRange } from './config/thresholds';
import { sendAlertEmail } from './services/email.service';

// ─────────────────────────────────────────────────────────────────────────────
// Données de mesure passées par le consumer MQTT
// ─────────────────────────────────────────────────────────────────────────────

export interface MeasurementForAlert {
  warehouseId: string;
  countryCode: string;
  temperature: number;
  humidity:    number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Logique de déduplication par type d'alerte
//
// - Si hors plage et aucune alerte active → créer
// - Si hors plage et alerte active existe → ignorer (pas de doublon)
// - Si dans la plage et alerte active existe → résoudre (resolvedAt = now())
// ─────────────────────────────────────────────────────────────────────────────

async function processAlert(
  warehouseId:   string,
  countryCode:   string,
  type:          AlertType,
  measuredValue: number,
  min:           number,
  max:           number,
  label:         string,
  unit:          string,
): Promise<void> {
  const isOutOfRange = measuredValue < min || measuredValue > max;

  const activeAlert = await prisma.alert.findFirst({
    where: { warehouseId, type, resolvedAt: null },
  });

  if (isOutOfRange && !activeAlert) {
    await prisma.alert.create({
      data: {
        warehouseId,
        countryCode,
        type,
        message:       `${label} hors plage acceptable`,
        measuredValue,
        minAllowed:    min,
        maxAllowed:    max,
      },
    });
    console.log(
      `[alert] ${type} créée — ${warehouseId} : ${measuredValue}${unit} hors plage [${min}-${max}]`
    );
    await sendAlertEmail({
      type,
      countryCode,
      warehouseId,
      measuredValue,
      minAllowed: min,
      maxAllowed: max,
      createdAt:  new Date(),
    });
    return;
  }

  if (!isOutOfRange && activeAlert) {
    await prisma.alert.update({
      where: { id: activeAlert.id },
      data:  { resolvedAt: new Date() },
    });
    console.log(`[alert] ${type} résolue — ${warehouseId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Point d'entrée : appelé après chaque mesure persistée
// ─────────────────────────────────────────────────────────────────────────────

export async function checkAlerts(measurement: MeasurementForAlert): Promise<void> {
  const config = COUNTRY_THRESHOLDS[measurement.countryCode];
  if (!config) return; // Aucun seuil configuré pour ce pays, on ignore silencieusement

  const tempRange     = getRange(config.temperature.target, config.temperature.tolerance);
  const humidityRange = getRange(config.humidity.target,    config.humidity.tolerance);

  // Les deux vérifications sont indépendantes, on les lance en parallèle
  await Promise.all([
    processAlert(
      measurement.warehouseId,
      measurement.countryCode,
      'TEMPERATURE',
      measurement.temperature,
      tempRange.min,
      tempRange.max,
      'Température',
      '°C',
    ),
    processAlert(
      measurement.warehouseId,
      measurement.countryCode,
      'HUMIDITY',
      measurement.humidity,
      humidityRange.min,
      humidityRange.max,
      'Humidité',
      '%',
    ),
  ]);
}
