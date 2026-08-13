"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLotExpired = isLotExpired;
exports.checkExpiredLots = checkExpiredLots;
const prisma_1 = __importDefault(require("./prisma"));
const email_service_1 = require("./services/email.service");
const EXPIRY_DAYS = 365;
/**
 * Fonction pure testable sans Prisma.
 * Retourne true si storageDate dépasse EXPIRY_DAYS jours avant now (strictement).
 */
function isLotExpired(storageDate, now) {
    return now.getTime() - storageDate.getTime() > EXPIRY_DAYS * 24 * 60 * 60 * 1000;
}
// ─────────────────────────────────────────────────────────────────────────────
// Détecte les lots dont la storageDate dépasse EXPIRY_DAYS jours.
//
// Pour chaque lot concerné :
//   1. Met à jour son statut à EXPIRED
//   2. Crée une alerte LOT_EXPIRED si aucune n'existe déjà pour ce lot
//
// Retourne le nombre de lots nouvellement marqués comme expirés.
// ─────────────────────────────────────────────────────────────────────────────
async function checkExpiredLots() {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const expiredLots = await prisma_1.default.lot.findMany({
        where: {
            storageDate: { lt: cutoffDate },
            status: { not: 'EXPIRED' },
        },
    });
    if (expiredLots.length === 0)
        return 0;
    let newlyExpiredCount = 0;
    for (const lot of expiredLots) {
        const daysStored = Math.floor((now.getTime() - lot.storageDate.getTime()) / (1000 * 60 * 60 * 24));
        // 1. Mettre à jour le statut du lot
        await prisma_1.default.lot.update({
            where: { id: lot.id },
            data: { status: 'EXPIRED' },
        });
        // 2. Créer l'alerte seulement s'il n'en existe pas déjà une pour ce lot
        const existingAlert = await prisma_1.default.alert.findFirst({
            where: { type: 'LOT_EXPIRED', lotId: lot.id },
        });
        if (!existingAlert) {
            await prisma_1.default.alert.create({
                data: {
                    warehouseId: lot.warehouseId,
                    countryCode: lot.countryCode,
                    type: 'LOT_EXPIRED',
                    message: `Lot stocké depuis ${daysStored} jours (limite : ${EXPIRY_DAYS} jours)`,
                    measuredValue: daysStored,
                    minAllowed: 0,
                    maxAllowed: EXPIRY_DAYS,
                    lotId: lot.id,
                },
            });
            console.log(`[expiry] LOT_EXPIRED créé — lot ${lot.id} (${lot.warehouseId}) : ${daysStored} jours`);
            await (0, email_service_1.sendAlertEmail)({
                type: 'LOT_EXPIRED',
                countryCode: lot.countryCode,
                warehouseId: lot.warehouseId,
                measuredValue: daysStored,
                minAllowed: 0,
                maxAllowed: EXPIRY_DAYS,
                createdAt: new Date(),
                lotId: lot.id,
                daysStored,
                storageDate: lot.storageDate,
            });
            newlyExpiredCount++;
        }
    }
    console.log(`[expiry] Vérification terminée : ${newlyExpiredCount} nouveau(x) lot(s) expiré(s) ` +
        `(${expiredLots.length} lot(s) total dépassant ${EXPIRY_DAYS} jours)`);
    return newlyExpiredCount;
}
