import mqtt from 'mqtt';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const BROKER_URL  = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
const TOPIC       = 'futurekawa/brazil/BR-WH-01/measurements';
const INTERVAL_MS = Number(process.env.INTERVAL_MS ?? 10_000);

const WAREHOUSE_ID = 'BR-WH-01';
const COUNTRY_CODE = 'BRA';

// Valeurs cibles Brésil (CDC §III-2)
const TEMP_TARGET     = 29;   // °C
const HUMIDITY_TARGET = 55;   // %

// ─────────────────────────────────────────────────────────────────────────────
// Générateur de mesures (marche aléatoire douce)
// ─────────────────────────────────────────────────────────────────────────────
//
// Principe : chaque nouvelle valeur est la valeur précédente + un léger bruit
// aléatoire + une correction douce vers la valeur cible (mean-reversion).
// Cela simule un capteur réel qui dérive progressivement plutôt que de sauter.
//
// Les bornes min/max sont légèrement plus larges que la tolérance acceptable
// du CDC (±3°C / ±2%) afin de simuler des dérives qui déclencheront des alertes.

let temperature = TEMP_TARGET;
let humidity    = HUMIDITY_TARGET;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function nextTemperature(): number {
  const noise = (Math.random() - 0.5) * 1.2;          // bruit ±0.6°C max par pas
  const pull  = (TEMP_TARGET - temperature) * 0.06;   // rappel vers la cible
  temperature = clamp(temperature + noise + pull, 24.0, 34.0);
  return round1(temperature);
}

function nextHumidity(): number {
  const noise = (Math.random() - 0.5) * 1.0;          // bruit ±0.5% max par pas
  const pull  = (HUMIDITY_TARGET - humidity) * 0.06;
  humidity = clamp(humidity + noise + pull, 50.0, 60.0);
  return round1(humidity);
}

// ─────────────────────────────────────────────────────────────────────────────
// Type du payload publié
// ─────────────────────────────────────────────────────────────────────────────

interface Measurement {
  warehouseId:  string;
  countryCode:  string;
  temperature:  number;
  humidity:     number;
  timestamp:    string;
}

function buildMeasurement(): Measurement {
  return {
    warehouseId:  WAREHOUSE_ID,
    countryCode:  COUNTRY_CODE,
    temperature:  nextTemperature(),
    humidity:     nextHumidity(),
    timestamp:    new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Connexion MQTT et boucle de publication
// ─────────────────────────────────────────────────────────────────────────────

const client = mqtt.connect(BROKER_URL);

client.on('connect', () => {
  console.log(`[simulator] Connecté au broker : ${BROKER_URL}`);
  console.log(`[simulator] Topic : ${TOPIC}`);
  console.log(`[simulator] Intervalle : ${INTERVAL_MS / 1000}s\n`);

  const publish = () => {
    const measurement = buildMeasurement();
    const payload     = JSON.stringify(measurement);

    client.publish(TOPIC, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error('[simulator] Erreur publication :', err.message);
      } else {
        console.log(`[simulator] ${measurement.timestamp}  T=${measurement.temperature}°C  H=${measurement.humidity}%`);
      }
    });
  };

  publish();                         // première mesure immédiate
  setInterval(publish, INTERVAL_MS); // puis toutes les N secondes
});

client.on('error', (err) => {
  console.error('[simulator] Erreur MQTT :', err.message);
});

client.on('reconnect', () => {
  console.log('[simulator] Reconnexion en cours...');
});

client.on('close', () => {
  console.log('[simulator] Connexion fermée.');
});
