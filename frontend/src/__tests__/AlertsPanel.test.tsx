import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AlertsPanel from '../components/AlertsPanel';
import type { Alert } from '../types';

const temperatureAlert: Alert = {
  id: 'alert-1',
  warehouseId: 'WH-BRA-01',
  countryCode: 'BRA',
  type: 'TEMPERATURE',
  message: 'Température hors plage acceptable',
  measuredValue: 35,
  minAllowed: 26,
  maxAllowed: 32,
  createdAt: '2026-08-13T10:00:00.000Z',
  resolvedAt: null,
  lotId: null,
};

const lotExpiredAlert: Alert = {
  id: 'alert-2',
  warehouseId: 'WH-BRA-02',
  countryCode: 'BRA',
  type: 'LOT_EXPIRED',
  message: 'Lot stocké depuis 400 jours',
  measuredValue: 400,
  minAllowed: 0,
  maxAllowed: 365,
  createdAt: '2026-08-13T10:00:00.000Z',
  resolvedAt: null,
  lotId: 'lot-old',
};

describe('AlertsPanel', () => {
  it('F7a – affiche "Aucune alerte" si liste vide', () => {
    render(<AlertsPanel alerts={[]} />);
    expect(screen.getByText(/aucune alerte/i)).toBeTruthy();
  });

  it('F7b – affiche une alerte TEMPERATURE avec les valeurs', () => {
    render(<AlertsPanel alerts={[temperatureAlert]} />);
    expect(screen.getByText('Température')).toBeTruthy();
    expect(screen.getByText('WH-BRA-01')).toBeTruthy();
    expect(screen.getByText('35')).toBeTruthy();
  });

  it('F7c – affiche une alerte LOT_EXPIRED avec le lotId', () => {
    render(<AlertsPanel alerts={[lotExpiredAlert]} />);
    expect(screen.getByText('Lot expiré')).toBeTruthy();
    expect(screen.getByText('lot-old')).toBeTruthy();
  });

  it('F7d – affiche plusieurs alertes', () => {
    render(<AlertsPanel alerts={[temperatureAlert, lotExpiredAlert]} />);
    expect(screen.getByText('Température')).toBeTruthy();
    expect(screen.getByText('Lot expiré')).toBeTruthy();
  });
});
