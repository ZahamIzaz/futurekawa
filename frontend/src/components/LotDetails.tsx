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

interface Props {
  lot: Lot;
}

export default function LotDetails({ lot }: Props) {
  return (
    <div className="lot-details">
      <div className="detail-row">
        <span className="detail-label">Identifiant</span>
        <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
          {lot.id}
        </span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Entrepôt</span>
        <span className="detail-value">{lot.warehouseId}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Pays</span>
        <span className="detail-value">{lot.countryCode}</span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Date de stockage</span>
        <span className="detail-value">
          {new Date(lot.storageDate).toLocaleDateString('fr-FR')}
        </span>
      </div>
      <div className="detail-row">
        <span className="detail-label">Statut</span>
        <span className={STATUS_CLASSES[lot.status]}>
          {STATUS_LABELS[lot.status]}
        </span>
      </div>
    </div>
  );
}
