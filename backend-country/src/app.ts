import express from 'express';
import measurementsRouter from './routes/measurements';
import lotsRouter         from './routes/lots';
import alertsRouter       from './routes/alerts';

const app = express();

app.use(express.json());

app.use('/api/measurements', measurementsRouter);
app.use('/api/lots',         lotsRouter);
app.use('/api/alerts',       alertsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend-country' });
});

export default app;
