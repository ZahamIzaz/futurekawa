import { describe, it, expect } from 'vitest';
import { getRange, COUNTRY_THRESHOLDS } from '../config/thresholds';

// ─── A1 : getRange calcule correctement les bornes ───────────────────────────
describe('getRange', () => {
  it('A1a – retourne min = target - tolerance et max = target + tolerance', () => {
    expect(getRange(29, 3)).toEqual({ min: 26, max: 32 });
  });

  it('A1b – fonctionne avec tolerance nulle', () => {
    expect(getRange(20, 0)).toEqual({ min: 20, max: 20 });
  });
});

// ─── A2 : seuils BRA corrects ─────────────────────────────────────────────────
describe('COUNTRY_THRESHOLDS BRA', () => {
  const bra = COUNTRY_THRESHOLDS['BRA'];

  it('A2a – température BRA : plage 26–32°C', () => {
    const range = getRange(bra.temperature.target, bra.temperature.tolerance);
    expect(range).toEqual({ min: 26, max: 32 });
  });

  it('A2b – humidité BRA : plage 53–57%', () => {
    const range = getRange(bra.humidity.target, bra.humidity.tolerance);
    expect(range).toEqual({ min: 53, max: 57 });
  });

  it('A2c – valeurs conforme température (26, 29, 32)', () => {
    const { min, max } = getRange(bra.temperature.target, bra.temperature.tolerance);
    expect(26).toBeGreaterThanOrEqual(min);
    expect(26).toBeLessThanOrEqual(max);
    expect(29).toBeGreaterThanOrEqual(min);
    expect(32).toBeLessThanOrEqual(max);
  });

  it('A2d – valeurs hors seuil température (25.9, 32.1)', () => {
    const { min, max } = getRange(bra.temperature.target, bra.temperature.tolerance);
    expect(25.9).toBeLessThan(min);
    expect(32.1).toBeGreaterThan(max);
  });

  it('A2e – valeurs conforme humidité (53, 55, 57)', () => {
    const { min, max } = getRange(bra.humidity.target, bra.humidity.tolerance);
    expect(53).toBeGreaterThanOrEqual(min);
    expect(57).toBeLessThanOrEqual(max);
  });

  it('A2f – valeurs hors seuil humidité (52.9, 57.1)', () => {
    const { min, max } = getRange(bra.humidity.target, bra.humidity.tolerance);
    expect(52.9).toBeLessThan(min);
    expect(57.1).toBeGreaterThan(max);
  });
});
