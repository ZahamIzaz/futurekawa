import express from 'express';
import countriesRouter from './routes/countries';

const app = express();

app.use(express.json());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin',  process.env.CORS_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend-central' });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/countries', countriesRouter);

export default app;
