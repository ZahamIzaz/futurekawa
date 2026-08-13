import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LotsTable from '../components/LotsTable';
import type { Lot } from '../types';

const lots: Lot[] = [
  {
    id: 'lot-001',
    warehouseId: 'WH-BRA-01',
    countryCode: 'BRA',
    storageDate: '2025-01-15T00:00:00.000Z',
    status: 'COMPLIANT',
    createdAt: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'lot-002',
    warehouseId: 'WH-BRA-02',
    countryCode: 'BRA',
    storageDate: '2024-01-01T00:00:00.000Z',
    status: 'EXPIRED',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

describe('LotsTable', () => {
  it('F3 – affiche le message vide si aucun lot', () => {
    render(<LotsTable lots={[]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText(/aucun lot/i)).toBeTruthy();
  });

  it('F4a – affiche les lots dans le tableau', () => {
    render(<LotsTable lots={lots} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('lot-001')).toBeTruthy();
    expect(screen.getByText('lot-002')).toBeTruthy();
    expect(screen.getByText('WH-BRA-01')).toBeTruthy();
  });

  it('F4b – surligne le lot sélectionné (row-selected)', () => {
    const { container } = render(
      <LotsTable lots={lots} selectedId="lot-001" onSelect={vi.fn()} />
    );
    const rows = container.querySelectorAll('tr.row-selected');
    expect(rows).toHaveLength(1);
  });

  it('F4c – appelle onSelect avec le bon lot au clic', () => {
    const onSelect = vi.fn();
    render(<LotsTable lots={lots} selectedId={null} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('lot-001'));

    expect(onSelect).toHaveBeenCalledWith(lots[0]);
  });

  it('F4d – affiche les badges de statut corrects', () => {
    render(<LotsTable lots={lots} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Conforme')).toBeTruthy();
    expect(screen.getByText('Expiré')).toBeTruthy();
  });
});
