import express from 'express';
import { startMqttClient } from './mqttClient';
import measurementsRouter from './routes/measurements';
import lotsRouter from './routes/lots';
import alertsRouter from './routes/alerts';

const app  = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/measurements', measurementsRouter);
app.use('/api/lots', lotsRouter);
app.use('/api/alerts', alertsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend-country' });
});

// ─── Démarrage ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Backend pays démarré sur le port ${PORT}`);
  startMqttClient();
});
