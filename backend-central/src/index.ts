import express from 'express';
import countriesRouter from './routes/countries';

const app  = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend-central' });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/countries', countriesRouter);

// ─── Démarrage ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Backend central démarré sur le port ${PORT}`);
});
