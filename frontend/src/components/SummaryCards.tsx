import type { Lot } from '../types';

interface Props {
  lots:        Lot[];
  alertsCount: number;
}

export default function SummaryCards({ lots, alertsCount }: Props) {
  const total     = lots.length;
  const compliant = lots.filter((l) => l.status === 'COMPLIANT').length;
  const expired   = lots.filter((l) => l.status === 'EXPIRED').length;

  return (
    <div className="summary-cards">
      <div className="card">
        <div className="card-value">{total}</div>
        <div className="card-label">Lots</div>
      </div>
      <div className="card card-green">
        <div className="card-value">{compliant}</div>
        <div className="card-label">Conformes</div>
      </div>
      <div className="card card-red">
        <div className="card-value">{expired}</div>
        <div className="card-label">Expirés</div>
      </div>
      <div className="card card-orange">
        <div className="card-value">{alertsCount}</div>
        <div className="card-label">Alertes actives</div>
      </div>
    </div>
  );
}
