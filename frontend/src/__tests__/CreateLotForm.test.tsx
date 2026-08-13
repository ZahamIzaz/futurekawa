import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/api', () => ({
  createLot: vi.fn(),
}));

import CreateLotForm from '../components/CreateLotForm';
import { createLot } from '../services/api';

const mockCreateLot = createLot as ReturnType<typeof vi.fn>;

const defaultProps = {
  countryCode: 'BRA',
  countryName: 'Brésil',
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CreateLotForm', () => {
  it('F9a – affiche le formulaire avec le pays pré-rempli', () => {
    render(<CreateLotForm {...defaultProps} />);
    expect(screen.getByText('Brésil')).toBeTruthy();
    expect(screen.getByLabelText(/Entrepôt/i)).toBeTruthy();
  });

  it('F9b – affiche une erreur si warehouseId est vide à la soumission', async () => {
    render(<CreateLotForm {...defaultProps} />);

    // Vider le champ entrepôt
    fireEvent.change(screen.getByLabelText(/Entrepôt/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /créer|ajouter/i }));

    await waitFor(() => {
      expect(screen.getByText(/identifiant.*obligatoire/i)).toBeTruthy();
    });
    expect(mockCreateLot).not.toHaveBeenCalled();
  });

  it('F9c – soumet le formulaire et appelle onSuccess', async () => {
    mockCreateLot.mockResolvedValue({ id: 'lot-new', status: 'COMPLIANT' });

    render(<CreateLotForm {...defaultProps} />);

    // Le champ entrepôt a déjà une valeur par défaut (BR-WH-01)
    fireEvent.click(screen.getByRole('button', { name: /créer|ajouter/i }));

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledOnce();
    });
  });

  it('F9d – affiche un message d\'erreur si l\'API échoue', async () => {
    mockCreateLot.mockRejectedValue(new Error('Un lot avec cet identifiant existe déjà.'));

    render(<CreateLotForm {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /créer|ajouter/i }));

    await waitFor(() => {
      expect(screen.getByText(/existe déjà/i)).toBeTruthy();
    });
  });
});
