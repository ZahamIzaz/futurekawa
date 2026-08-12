import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { Measurement } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface Props {
  measurements: Measurement[];
}

function formatLabel(ts: string): string {
  const d = new Date(ts);
  return `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', {
    hour:   '2-digit',
    minute: '2-digit',
  })}`;
}

const baseOptions: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 8,
        maxRotation:   45,
        font:          { size: 10 },
      },
    },
  },
};

export default function MeasurementsCharts({ measurements }: Props) {
  if (measurements.length === 0) {
    return <p className="empty-message">Aucune mesure disponible pour ce lot.</p>;
  }

  const labels = measurements.map((m) => formatLabel(m.timestamp));

  const tempData = {
    labels,
    datasets: [
      {
        label:           'Température (°C)',
        data:            measurements.map((m) => m.temperature),
        borderColor:     '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        tension:         0.3,
        pointRadius:     3,
      },
    ],
  };

  const humidityData = {
    labels,
    datasets: [
      {
        label:           'Humidité (%)',
        data:            measurements.map((m) => m.humidity),
        borderColor:     '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        tension:         0.3,
        pointRadius:     3,
      },
    ],
  };

  const tempOptions: ChartOptions<'line'> = {
    ...baseOptions,
    scales: {
      ...baseOptions.scales,
      y: { title: { display: true, text: '°C' } },
    },
  };

  const humOptions: ChartOptions<'line'> = {
    ...baseOptions,
    scales: {
      ...baseOptions.scales,
      y: { title: { display: true, text: '%' } },
    },
  };

  return (
    <div className="charts-container">
      <div className="chart-wrapper">
        <h3>Température (°C)</h3>
        <Line data={tempData} options={tempOptions} />
      </div>
      <div className="chart-wrapper">
        <h3>Humidité (%)</h3>
        <Line data={humidityData} options={humOptions} />
      </div>
    </div>
  );
}
