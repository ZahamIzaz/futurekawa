"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const mqttClient_1 = require("./mqttClient");
const lotExpiryService_1 = require("./lotExpiryService");
const PORT = Number(process.env.PORT ?? 3001);
app_1.default.listen(PORT, () => {
    console.log(`[server] Backend pays démarré sur le port ${PORT}`);
    (0, mqttClient_1.startMqttClient)();
    // Vérification de péremption au démarrage, puis toutes les heures
    (0, lotExpiryService_1.checkExpiredLots)().catch((err) => console.error('[expiry] Erreur au démarrage :', err));
    setInterval(() => (0, lotExpiryService_1.checkExpiredLots)().catch((err) => console.error('[expiry] Erreur intervalle :', err)), 60 * 60 * 1000);
});
