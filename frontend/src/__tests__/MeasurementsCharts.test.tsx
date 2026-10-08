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
    expect(screen.getByRole('heading', { name: /Température/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Humidité/i })).toBeTruthy();
  });

  it('F6b – affiche la dernière mesure (date locale, température, humidité)', () => {
    render(<MeasurementsCharts measurements={measurements} />);
    const d = new Date('2025-01-15T11:00:00.000Z');
    const expected = `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR')}`;
    expect(screen.getByText(`Dernière mesure : ${expected}`)).toBeTruthy();
    expect(screen.getByText('Température : 29,1 °C | Humidité : 55 %')).toBeTruthy();
  });

  it('F6c – sélectionne le timestamp le plus récent même si les mesures sont désordonnées', () => {
    const unordered: Measurement[] = [
      { temperature: 27.0, humidity: 58.0, timestamp: '2025-01-15T12:00:00.000Z' },
      { temperature: 30.5, humidity: 52.4, timestamp: '2025-01-15T09:00:00.000Z' },
      { temperature: 26.0, humidity: 59.2, timestamp: '2025-01-15T15:40:52.000Z' },
      { temperature: 29.0, humidity: 55.0, timestamp: '2025-01-15T10:00:00.000Z' },
    ];
    render(<MeasurementsCharts measurements={unordered} />);
    const d = new Date('2025-01-15T15:40:52.000Z');
    const expected = `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR')}`;
    expect(screen.getByText(`Dernière mesure : ${expected}`)).toBeTruthy();
    expect(screen.getByText('Température : 26 °C | Humidité : 59,2 %')).toBeTruthy();
  });

  it('F6d – n\'affiche pas la synthèse quand la liste est vide', () => {
    render(<MeasurementsCharts measurements={[]} />);
    expect(screen.queryByText(/Dernière mesure/)).toBeNull();
  });
});
