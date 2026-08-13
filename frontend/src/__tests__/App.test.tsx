import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock des services API
vi.mock('../services/api', () => ({
  fetchCountries: vi.fn(),
  fetchLots: vi.fn(),
  fetchLot: vi.fn(),
  fetchMeasurements: vi.fn(),
  fetchAlerts: vi.fn(),
  createLot: vi.fn(),
}));

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Line: () => <canvas data-testid="chart-line" />,
}));

import App from '../App';
import * as api from '../services/api';

const mockFetchCountries = api.fetchCountries as ReturnType<typeof vi.fn>;
const mockFetchLots = api.fetchLots as ReturnType<typeof vi.fn>;
const mockFetchAlerts = api.fetchAlerts as ReturnType<typeof vi.fn>;

const fakeCountries = [{ code: 'BRA', name: 'Brésil' }];
const fakeLots = [
  {
    id: 'lot-001',
    warehouseId: 'WH-BRA-01',
    countryCode: 'BRA',
    storageDate: '2025-01-01T00:00:00.000Z',
    status: 'COMPLIANT',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];
const fakeAlerts = [
  {
    id: 'alert-1',
    warehouseId: 'WH-BRA-01',
    countryCode: 'BRA',
    type: 'TEMPERATURE',
    message: 'Température hors plage',
    measuredValue: 35,
    minAllowed: 26,
    maxAllowed: 32,
    createdAt: '2026-08-13T10:00:00.000Z',
    resolvedAt: null,
    lotId: null,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  // Bloquer l'auto-refresh (setInterval de 10s) sans bloquer les Promises
  vi.spyOn(global, 'setInterval').mockReturnValue(0 as any);

  mockFetchCountries.mockResolvedValue(fakeCountries);
  mockFetchLots.mockResolvedValue(fakeLots);
  mockFetchAlerts.mockResolvedValue(fakeAlerts);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  it('F1 – charge et affiche les pays au démarrage', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Brésil')).toBeTruthy();
    });
    expect(mockFetchCountries).toHaveBeenCalledOnce();
  });

  it('F8 – affiche les lots après sélection d\'un pays', async () => {
    render(<App />);

    // Attendre que les pays soient chargés
    await waitFor(() => {
      expect(screen.getByText('Brésil')).toBeTruthy();
    });

    // Sélectionner le pays BRA
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'BRA' } });

    await waitFor(() => {
      expect(screen.getByText('lot-001')).toBeTruthy();
    });
    expect(mockFetchLots).toHaveBeenCalledWith('BRA');
  });
});
