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
        autoSkip:      true,
        maxTicksLimit: 8,
        maxRotation:   45,
        font:          { size: 10 },
      },
    },
  },
};

// Date et heure complètes (avec secondes) en heure locale du navigateur
function formatFull(ts: string): string {
  const d = new Date(ts);
  return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR')}`;
}

function latestMeasurement(measurements: Measurement[]): Measurement {
  return measurements.reduce((latest, m) =>
    Date.parse(m.timestamp) > Date.parse(latest.timestamp) ? m : latest,
  );
}

export default function MeasurementsCharts({ measurements }: Props) {
  if (measurements.length === 0) {
    return <p className="empty-message">Aucune mesure disponible pour ce lot.</p>;
  }

  const latest = latestMeasurement(measurements);
  const labels = measurements.map((m) => formatLabel(m.timestamp));

  const tooltipPlugins: ChartOptions<'line'>['plugins'] = {
    ...baseOptions.plugins,
    tooltip: {
      callbacks: {
        title: (items) => {
          const m = items.length > 0 ? measurements[items[0].dataIndex] : undefined;
          return m ? formatFull(m.timestamp) : '';
        },
      },
    },
  };

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
    plugins: tooltipPlugins,
    scales: {
      ...baseOptions.scales,
      y: { title: { display: true, text: '°C' } },
    },
  };

  const humOptions: ChartOptions<'line'> = {
    ...baseOptions,
    plugins: tooltipPlugins,
    scales: {
      ...baseOptions.scales,
      y: { title: { display: true, text: '%' } },
    },
  };

  return (
    <>
      <div className="last-measurement">
        <p className="last-measurement-date">
          Dernière mesure : {formatFull(latest.timestamp)}
        </p>
        <p className="last-measurement-values">
          Température : {latest.temperature.toLocaleString('fr-FR')} °C | Humidité :{' '}
          {latest.humidity.toLocaleString('fr-FR')} %
        </p>
      </div>
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
    </>
  );
}
