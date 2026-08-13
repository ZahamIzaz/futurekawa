"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAlerts = checkAlerts;
const prisma_1 = __importDefault(require("./prisma"));
const thresholds_1 = require("./config/thresholds");
const email_service_1 = require("./services/email.service");
// ─────────────────────────────────────────────────────────────────────────────
// Logique de déduplication par type d'alerte
//
// - Si hors plage et aucune alerte active → créer
// - Si hors plage et alerte active existe → ignorer (pas de doublon)
// - Si dans la plage et alerte active existe → résoudre (resolvedAt = now())
// ─────────────────────────────────────────────────────────────────────────────
async function processAlert(warehouseId, countryCode, type, measuredValue, min, max, label, unit) {
    const isOutOfRange = measuredValue < min || measuredValue > max;
    const activeAlert = await prisma_1.default.alert.findFirst({
        where: { warehouseId, type, resolvedAt: null },
    });
    if (isOutOfRange && !activeAlert) {
        await prisma_1.default.alert.create({
            data: {
                warehouseId,
                countryCode,
                type,
                message: `${label} hors plage acceptable`,
                measuredValue,
                minAllowed: min,
                maxAllowed: max,
            },
        });
        console.log(`[alert] ${type} créée — ${warehouseId} : ${measuredValue}${unit} hors plage [${min}-${max}]`);
        await (0, email_service_1.sendAlertEmail)({
            type,
            countryCode,
            warehouseId,
            measuredValue,
            minAllowed: min,
            maxAllowed: max,
            createdAt: new Date(),
        });
        return;
    }
    if (!isOutOfRange && activeAlert) {
        await prisma_1.default.alert.update({
            where: { id: activeAlert.id },
            data: { resolvedAt: new Date() },
        });
        console.log(`[alert] ${type} résolue — ${warehouseId}`);
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// Point d'entrée : appelé après chaque mesure persistée
// ─────────────────────────────────────────────────────────────────────────────
async function checkAlerts(measurement) {
    const config = thresholds_1.COUNTRY_THRESHOLDS[measurement.countryCode];
    if (!config)
        return; // Aucun seuil configuré pour ce pays, on ignore silencieusement
    const tempRange = (0, thresholds_1.getRange)(config.temperature.target, config.temperature.tolerance);
    const humidityRange = (0, thresholds_1.getRange)(config.humidity.target, config.humidity.tolerance);
    // Les deux vérifications sont indépendantes, on les lance en parallèle
    await Promise.all([
        processAlert(measurement.warehouseId, measurement.countryCode, 'TEMPERATURE', measurement.temperature, tempRange.min, tempRange.max, 'Température', '°C'),
        processAlert(measurement.warehouseId, measurement.countryCode, 'HUMIDITY', measurement.humidity, humidityRange.min, humidityRange.max, 'Humidité', '%'),
    ]);
}
