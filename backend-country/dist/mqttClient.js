"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMqttClient = startMqttClient;
const mqtt_1 = __importDefault(require("mqtt"));
const prisma_1 = __importDefault(require("./prisma"));
const alertService_1 = require("./alertService");
const BROKER_URL = process.env.MQTT_BROKER_URL ?? 'mqtt://localhost:1883';
const TOPIC = 'futurekawa/brazil/+/measurements';
function isValidPayload(data) {
    if (typeof data !== 'object' || data === null)
        return false;
    const d = data;
    return (typeof d.warehouseId === 'string' &&
        typeof d.countryCode === 'string' &&
        typeof d.temperature === 'number' &&
        typeof d.humidity === 'number' &&
        typeof d.timestamp === 'string');
}
function startMqttClient() {
    const client = mqtt_1.default.connect(BROKER_URL);
    client.on('connect', () => {
        console.log(`[mqtt] Connecté au broker : ${BROKER_URL}`);
        client.subscribe(TOPIC, { qos: 1 }, (err) => {
            if (err) {
                console.error('[mqtt] Erreur abonnement :', err.message);
            }
            else {
                console.log(`[mqtt] Abonné au topic : ${TOPIC}`);
            }
        });
    });
    client.on('message', async (_topic, payload) => {
        let data;
        try {
            data = JSON.parse(payload.toString());
        }
        catch {
            console.error('[mqtt] Payload JSON invalide, message ignoré.');
            return;
        }
        if (!isValidPayload(data)) {
            console.error('[mqtt] Payload inattendu, message ignoré :', data);
            return;
        }
        try {
            await prisma_1.default.measurement.create({
                data: {
                    warehouseId: data.warehouseId,
                    countryCode: data.countryCode,
                    temperature: data.temperature,
                    humidity: data.humidity,
                    timestamp: new Date(data.timestamp),
                },
            });
            console.log(`[mqtt] Mesure enregistrée — ${data.warehouseId}  T=${data.temperature}°C  H=${data.humidity}%`);
            await (0, alertService_1.checkAlerts)({
                warehouseId: data.warehouseId,
                countryCode: data.countryCode,
                temperature: data.temperature,
                humidity: data.humidity,
            });
        }
        catch (err) {
            console.error('[mqtt] Erreur base de données :', err);
        }
    });
    client.on('error', (err) => {
        console.error('[mqtt] Erreur :', err.message);
    });
    client.on('reconnect', () => {
        console.log('[mqtt] Reconnexion en cours...');
    });
}
