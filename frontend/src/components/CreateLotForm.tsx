import { useState } from 'react';
import { createLot } from '../services/api';
import type { CreateLotPayload } from '../services/api';

interface Props {
  countryCode: string;
  countryName: string;
  onClose:     () => void;
  onSuccess:   () => void;
}

export default function CreateLotForm({
  countryCode,
  countryName,
  onClose,
  onSuccess,
}: Props) {
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  const [warehouseId, setWarehouseId] = useState('BR-WH-01');
  const [storageDate, setStorageDate] = useState(today);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!warehouseId.trim()) {
      setError("L'identifiant de l'entrepôt est obligatoire.");
      return;
    }
    if (!storageDate) {
      setError('La date de stockage est obligatoire.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateLotPayload = {
        warehouseId: warehouseId.trim(),
        countryCode,
        // Les date-only strings sont parsées en UTC par les navigateurs → ISO correct
        storageDate: new Date(storageDate).toISOString(),
      };
      await createLot(countryCode, payload);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'Backend pays indisponible') {
        setError('Le service du pays sélectionné est temporairement indisponible.');
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('Le service central FutureKawa est temporairement indisponible.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Ajouter un lot</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Pays</label>
            <div className="form-static">{countryName}</div>
          </div>

          <div className="form-group">
            <label htmlFor="warehouseId">Entrepôt</label>
            <input
              id="warehouseId"
              type="text"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              placeholder="ex : BR-WH-01"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="storageDate">Date de stockage</label>
            <input
              id="storageDate"
              type="date"
              value={storageDate}
              onChange={(e) => setStorageDate(e.target.value)}
              disabled={submitting}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Annuler
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Création…' : 'Créer le lot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
