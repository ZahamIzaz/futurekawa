import app from './app';
import { startMqttClient } from './mqttClient';
import { checkExpiredLots } from './lotExpiryService';

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`[server] Backend pays démarré sur le port ${PORT}`);
  startMqttClient();

  // Vérification de péremption au démarrage, puis toutes les heures
  checkExpiredLots().catch((err) => console.error('[expiry] Erreur au démarrage :', err));
  setInterval(
    () => checkExpiredLots().catch((err) => console.error('[expiry] Erreur intervalle :', err)),
    60 * 60 * 1000, // toutes les heures
  );
});