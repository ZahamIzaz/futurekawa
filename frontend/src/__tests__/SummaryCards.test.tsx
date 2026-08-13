import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SummaryCards from '../components/SummaryCards';
import type { Lot } from '../types';

const makeLot = (status: 'COMPLIANT' | 'ALERT' | 'EXPIRED'): Lot => ({
  id: `lot-${Math.random()}`,
  warehouseId: 'WH-BRA-01',
  countryCode: 'BRA',
  storageDate: '2025-01-01T00:00:00.000Z',
  status,
  createdAt: '2025-01-01T00:00:00.000Z',
});

describe('SummaryCards', () => {
  it('F2a – affiche les compteurs corrects', () => {
    const lots: Lot[] = [
      makeLot('COMPLIANT'),
      makeLot('COMPLIANT'),
      makeLot('EXPIRED'),
      makeLot('ALERT'),
    ];

    render(<SummaryCards lots={lots} alertsCount={3} />);

    // Total = 4
    expect(screen.getByText('4')).toBeTruthy();
    // Conformes = 2
    expect(screen.getByText('2')).toBeTruthy();
    // Expirés = 1
    expect(screen.getByText('1')).toBeTruthy();
    // Alertes actives = 3
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('F2b – affiche 0 lots et 0 alertes quand liste vide', () => {
    render(<SummaryCards lots={[]} alertsCount={0} />);

    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(3); // total, conformes, expirés = tous 0
  });
});
