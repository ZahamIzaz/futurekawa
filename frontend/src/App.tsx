import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchAlerts,
  fetchCountries,
  fetchLots,
  fetchMeasurements,
} from './services/api';
import type { Alert, Country, Lot, Measurement } from './types';
import AlertsPanel        from './components/AlertsPanel';
import CountrySelector    from './components/CountrySelector';
import LotDetails         from './components/LotDetails';
import LotsTable          from './components/LotsTable';
import MeasurementsCharts from './components/MeasurementsCharts';
import SummaryCards       from './components/SummaryCards';

const UNAVAILABLE_MSG =
  'Le service central FutureKawa est temporairement indisponible.';

export default function App() {
  const [countries,       setCountries]       = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [lots,            setLots]            = useState<Lot[]>([]);
  const [selectedLot,     setSelectedLot]     = useState<Lot | null>(null);
  const [measurements,    setMeasurements]    = useState<Measurement[]>([]);
  const [alerts,          setAlerts]          = useState<Alert[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  // Ref to read selectedLot inside the interval without stale closures
  const selectedLotRef = useRef<Lot | null>(null);
  selectedLotRef.current = selectedLot;

  // ── Load countries once on mount ─────────────────────────────────────────
  useEffect(() => {
    fetchCountries()
      .then((data) => {
        setCountries(data);
        if (data.length > 0) setSelectedCountry(data[0].code);
      })
      .catch(() => setError(UNAVAILABLE_MSG));
  }, []);

  // ── Load lots + alerts for the current country ───────────────────────────
  const loadCountryData = useCallback(
    async (country: string, showLoader = false) => {
      if (!country) return;
      if (showLoader) { setLoading(true); setError(null); }
      try {
        const [lotsData, alertsData] = await Promise.all([
          fetchLots(country),
          fetchAlerts(country),
        ]);
        setLots(lotsData);
        setAlerts(alertsData);
      } catch {
        setError(UNAVAILABLE_MSG);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    setSelectedLot(null);
    setMeasurements([]);
    loadCountryData(selectedCountry, true);
  }, [selectedCountry, loadCountryData]);

  // ── Load measurements when a lot is selected ─────────────────────────────
  const selectedLotId = selectedLot?.id;
  useEffect(() => {
    if (!selectedLotId || !selectedCountry) return;
    fetchMeasurements(selectedCountry, selectedLotId)
      .then(setMeasurements)
      .catch(() => setMeasurements([]));
  }, [selectedLotId, selectedCountry]);

  // ── Auto-refresh every 10 s ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCountry) return;

    const refresh = async () => {
      try {
        const [lotsData, alertsData] = await Promise.all([
          fetchLots(selectedCountry),
          fetchAlerts(selectedCountry),
        ]);
        setLots(lotsData);
        setAlerts(alertsData);
      } catch { /* silent fail */ }

      const lot = selectedLotRef.current;
      if (lot) {
        try {
          const data = await fetchMeasurements(selectedCountry, lot.id);
          setMeasurements(data);
        } catch { /* silent fail */ }
      }
    };

    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [selectedCountry]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <header className="header">
        <h1>FutureKawa</h1>
        <p className="subtitle">Supervision des stocks et conditions de stockage</p>
      </header>

      <main className="main">
        <div className="toolbar">
          <CountrySelector
            countries={countries}
            selected={selectedCountry}
            onChange={setSelectedCountry}
          />
          <button
            className="btn-refresh"
            onClick={() => loadCountryData(selectedCountry, true)}
          >
            ↻ Actualiser
          </button>
        </div>

        {error   && <div className="error-banner">{error}</div>}
        {loading && <div className="loading">Chargement en cours…</div>}

        {!loading && !error && (
          <>
            <SummaryCards lots={lots} alertsCount={alerts.length} />

            <section className="section">
              <h2>Lots – ordre FIFO</h2>
              <LotsTable
                lots={lots}
                selectedId={selectedLot?.id ?? null}
                onSelect={setSelectedLot}
              />
            </section>

            {selectedLot && (
              <>
                <section className="section">
                  <h2>Lot sélectionné</h2>
                  <LotDetails lot={selectedLot} />
                </section>

                <section className="section">
                  <h2>Historique température / humidité</h2>
                  <MeasurementsCharts measurements={measurements} />
                </section>
              </>
            )}

            <section className="section">
              <h2>Alertes actives</h2>
              <AlertsPanel alerts={alerts} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
