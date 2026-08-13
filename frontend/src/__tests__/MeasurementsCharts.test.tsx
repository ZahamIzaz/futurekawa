import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock react-chartjs-2 pour éviter les problèmes Canvas dans jsdom
vi.mock('react-chartjs-2', () => ({
  Line: () => <canvas data-testid="chart-line" />,
}));

import MeasurementsCharts from '../components/MeasurementsCharts';
import type { Measurement } from '../types';

const measurements: Measurement[] = [
  { temperature: 28.5, humidity: 54.2, timestamp: '2025-01-15T10:00:00.000Z' },
  { temperature: 29.1, humidity: 55.0, timestamp: '2025-01-15T11:00:00.000Z' },
];

describe('MeasurementsCharts', () => {
  it('F5 – affiche le message vide si aucune mesure', () => {
    render(<MeasurementsCharts measurements={[]} />);
    expect(screen.getByText(/aucune mesure/i)).toBeTruthy();
  });

  it('F6 – rend les deux graphiques quand des mesures sont disponibles', () => {
    render(<MeasurementsCharts measurements={measurements} />);
    const charts = screen.getAllByTestId('chart-line');
    expect(charts).toHaveLength(2);
    expect(screen.getByText(/Température/i)).toBeTruthy();
    expect(screen.getByText(/Humidité/i)).toBeTruthy();
  });
});
