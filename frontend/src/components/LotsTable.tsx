import type { Lot, LotStatus } from '../types';

const STATUS_LABELS: Record<LotStatus, string> = {
  COMPLIANT: 'Conforme',
  ALERT:     'Alerte',
  EXPIRED:   'Expiré',
};

const STATUS_CLASSES: Record<LotStatus, string> = {
  COMPLIANT: 'badge badge-green',
  ALERT:     'badge badge-orange',
  EXPIRED:   'badge badge-red',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

interface Props {
  lots:       Lot[];
  selectedId: string | null;
  onSelect:   (lot: Lot) => void;
}

export default function LotsTable({ lots, selectedId, onSelect }: Props) {
  if (lots.length === 0) {
    return <p className="empty-message">Aucun lot disponible.</p>;
  }

  return (
    <table className="lots-table">
      <thead>
        <tr>
          <th>Identifiant</th>
          <th>Entrepôt</th>
          <th>Date de stockage</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        {lots.map((lot) => (
          <tr
            key={lot.id}
            className={lot.id === selectedId ? 'row-selected' : ''}
            onClick={() => onSelect(lot)}
          >
            <td className="lot-id">{lot.id}</td>
            <td>{lot.warehouseId}</td>
            <td>{formatDate(lot.storageDate)}</td>
            <td>
              <span className={STATUS_CLASSES[lot.status]}>
                {STATUS_LABELS[lot.status]}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
