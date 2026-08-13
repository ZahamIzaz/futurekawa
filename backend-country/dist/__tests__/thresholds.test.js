"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const thresholds_1 = require("../config/thresholds");
// ─── A1 : getRange calcule correctement les bornes ───────────────────────────
(0, vitest_1.describe)('getRange', () => {
    (0, vitest_1.it)('A1a – retourne min = target - tolerance et max = target + tolerance', () => {
        (0, vitest_1.expect)((0, thresholds_1.getRange)(29, 3)).toEqual({ min: 26, max: 32 });
    });
    (0, vitest_1.it)('A1b – fonctionne avec tolerance nulle', () => {
        (0, vitest_1.expect)((0, thresholds_1.getRange)(20, 0)).toEqual({ min: 20, max: 20 });
    });
});
// ─── A2 : seuils BRA corrects ─────────────────────────────────────────────────
(0, vitest_1.describe)('COUNTRY_THRESHOLDS BRA', () => {
    const bra = thresholds_1.COUNTRY_THRESHOLDS['BRA'];
    (0, vitest_1.it)('A2a – température BRA : plage 26–32°C', () => {
        const range = (0, thresholds_1.getRange)(bra.temperature.target, bra.temperature.tolerance);
        (0, vitest_1.expect)(range).toEqual({ min: 26, max: 32 });
    });
    (0, vitest_1.it)('A2b – humidité BRA : plage 53–57%', () => {
        const range = (0, thresholds_1.getRange)(bra.humidity.target, bra.humidity.tolerance);
        (0, vitest_1.expect)(range).toEqual({ min: 53, max: 57 });
    });
    (0, vitest_1.it)('A2c – valeurs conforme température (26, 29, 32)', () => {
        const { min, max } = (0, thresholds_1.getRange)(bra.temperature.target, bra.temperature.tolerance);
        (0, vitest_1.expect)(26).toBeGreaterThanOrEqual(min);
        (0, vitest_1.expect)(26).toBeLessThanOrEqual(max);
        (0, vitest_1.expect)(29).toBeGreaterThanOrEqual(min);
        (0, vitest_1.expect)(32).toBeLessThanOrEqual(max);
    });
    (0, vitest_1.it)('A2d – valeurs hors seuil température (25.9, 32.1)', () => {
        const { min, max } = (0, thresholds_1.getRange)(bra.temperature.target, bra.temperature.tolerance);
        (0, vitest_1.expect)(25.9).toBeLessThan(min);
        (0, vitest_1.expect)(32.1).toBeGreaterThan(max);
    });
    (0, vitest_1.it)('A2e – valeurs conforme humidité (53, 55, 57)', () => {
        const { min, max } = (0, thresholds_1.getRange)(bra.humidity.target, bra.humidity.tolerance);
        (0, vitest_1.expect)(53).toBeGreaterThanOrEqual(min);
        (0, vitest_1.expect)(57).toBeLessThanOrEqual(max);
    });
    (0, vitest_1.it)('A2f – valeurs hors seuil humidité (52.9, 57.1)', () => {
        const { min, max } = (0, thresholds_1.getRange)(bra.humidity.target, bra.humidity.tolerance);
        (0, vitest_1.expect)(52.9).toBeLessThan(min);
        (0, vitest_1.expect)(57.1).toBeGreaterThan(max);
    });
});
