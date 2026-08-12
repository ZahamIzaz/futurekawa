import type { Alert, AlertType } from '../types';

const TYPE_LABELS: Record<AlertType, string> = {
  TEMPERATURE: 'Température',
  HUMIDITY:    'Humidité',
  LOT_EXPIRED: 'Lot expiré',
};

const TYPE_CLASSES: Record<AlertType, string> = {
  TEMPERATURE: 'badge badge-red',
  HUMIDITY:    'badge badge-blue',
  LOT_EXPIRED: 'badge badge-orange',
};

interface Props {
  alerts: Alert[];
}

export default function AlertsPanel({ alerts }: Props) {
  if (alerts.length === 0) {
    return <p className="empty-message">Aucune alerte active.</p>;
  }

  return (
    <div className="alerts-list">
      {alerts.map((alert) => (
        <div key={alert.id} className="alert-item">
          <div className="alert-header">
            <span className={TYPE_CLASSES[alert.type]}>
              {TYPE_LABELS[alert.type]}
            </span>
            <span className="alert-warehouse">{alert.warehouseId}</span>
            <span className="alert-date">
              {new Date(alert.createdAt).toLocaleString('fr-FR')}
            </span>
          </div>
          <div className="alert-body">
            <span className="alert-message">{alert.message}</span>
            {alert.type !== 'LOT_EXPIRED' ? (
              <span className="alert-values">
                Valeur mesurée&nbsp;: <strong>{alert.measuredValue}</strong>
                &nbsp;—&nbsp;
                Plage autorisée&nbsp;: {alert.minAllowed}&nbsp;–&nbsp;{alert.maxAllowed}
              </span>
            ) : (
              <span className="alert-values">
                {alert.measuredValue} jours stockés (limite&nbsp;: {alert.maxAllowed} jours)
                {alert.lotId && <>&nbsp;— Lot&nbsp;: <code>{alert.lotId}</code></>}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
