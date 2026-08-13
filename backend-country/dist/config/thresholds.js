"use strict";
// ─────────────────────────────────────────────────────────────────────────────
// Configuration centralisée des seuils par pays
//
// Pour ajouter un pays, il suffit d'ajouter une entrée dans COUNTRY_THRESHOLDS
// en utilisant le countryCode ISO alpha-3 comme clé.
// ─────────────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.COUNTRY_THRESHOLDS = void 0;
exports.getRange = getRange;
exports.COUNTRY_THRESHOLDS = {
    BRA: {
        countryCode: 'BRA',
        temperature: { target: 29, tolerance: 3 }, // plage : 26–32°C
        humidity: { target: 55, tolerance: 2 }, // plage : 53–57%
    },
    // ECU: { countryCode: 'ECU', temperature: { target: 31, tolerance: 3 }, humidity: { target: 60, tolerance: 2 } },
    // COL: { countryCode: 'COL', temperature: { target: 26, tolerance: 3 }, humidity: { target: 80, tolerance: 2 } },
};
function getRange(target, tolerance) {
    return { min: target - tolerance, max: target + tolerance };
}
