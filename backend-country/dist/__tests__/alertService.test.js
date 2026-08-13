"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ─── Mocks ────────────────────────────────────────────────────────────────────
vitest_1.vi.mock('../prisma', () => ({
    default: {
        alert: {
            findFirst: vitest_1.vi.fn(),
            create: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
        },
    },
}));
vitest_1.vi.mock('../services/email.service', () => ({
    sendAlertEmail: vitest_1.vi.fn().mockResolvedValue(undefined),
}));
const alertService_1 = require("../alertService");
const prisma_1 = __importDefault(require("../prisma"));
const email_service_1 = require("../services/email.service");
const mockAlert = prisma_1.default.alert;
const mockSendEmail = email_service_1.sendAlertEmail;
// Mesure BRA hors-seuil température (33°C > 32), humidité OK (55%)
const measurementTempAlerte = {
    warehouseId: 'WH-BRA-01',
    countryCode: 'BRA',
    temperature: 33,
    humidity: 55,
};
// Mesure BRA conforme (28°C, 55%)
const measurementOk = {
    warehouseId: 'WH-BRA-01',
    countryCode: 'BRA',
    temperature: 28,
    humidity: 55,
};
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    mockAlert.create.mockResolvedValue({});
    mockAlert.update.mockResolvedValue({});
    mockSendEmail.mockResolvedValue(undefined);
});
// ─── C1 : Création d'alerte si hors plage et aucune alerte active ─────────────
(0, vitest_1.describe)('checkAlerts – création alerte', () => {
    (0, vitest_1.it)('C1 – crée une alerte TEMPERATURE si hors plage et aucune alerte active', async () => {
        // findFirst retourne null pour TEMPERATURE (pas d'alerte), et null pour HUMIDITY
        mockAlert.findFirst.mockResolvedValue(null);
        await (0, alertService_1.checkAlerts)(measurementTempAlerte);
        // prisma.alert.create doit avoir été appelé pour TEMPERATURE
        const createCalls = mockAlert.create.mock.calls;
        const tempCreate = createCalls.find((c) => c[0]?.data?.type === 'TEMPERATURE');
        (0, vitest_1.expect)(tempCreate).toBeDefined();
        (0, vitest_1.expect)(tempCreate[0].data.measuredValue).toBe(33);
    });
});
// ─── C2 : Email envoyé lors de la création ────────────────────────────────────
(0, vitest_1.describe)('checkAlerts – envoi email', () => {
    (0, vitest_1.it)('C2 – envoie un email lors de la création d\'alerte', async () => {
        mockAlert.findFirst.mockResolvedValue(null);
        await (0, alertService_1.checkAlerts)(measurementTempAlerte);
        (0, vitest_1.expect)(mockSendEmail).toHaveBeenCalled();
        const callArg = mockSendEmail.mock.calls[0][0];
        (0, vitest_1.expect)(callArg.type).toBe('TEMPERATURE');
        (0, vitest_1.expect)(callArg.countryCode).toBe('BRA');
    });
});
// ─── C3 : Pas de doublon si alerte active existe déjà ─────────────────────────
(0, vitest_1.describe)('checkAlerts – déduplication', () => {
    (0, vitest_1.it)('C3 – ne crée pas de doublon si alerte active existe', async () => {
        // findFirst retourne une alerte active existante
        const existingAlert = { id: 'alert-1', type: 'TEMPERATURE', resolvedAt: null };
        mockAlert.findFirst.mockResolvedValue(existingAlert);
        await (0, alertService_1.checkAlerts)(measurementTempAlerte);
        (0, vitest_1.expect)(mockAlert.create).not.toHaveBeenCalled();
        (0, vitest_1.expect)(mockSendEmail).not.toHaveBeenCalled();
    });
});
// ─── C4 : Résolution d'alerte si mesure revenue dans les plages ───────────────
(0, vitest_1.describe)('checkAlerts – résolution', () => {
    (0, vitest_1.it)('C4 – résout l\'alerte active quand la mesure revient dans la plage', async () => {
        const existingHumidityAlert = { id: 'alert-2', type: 'HUMIDITY', resolvedAt: null };
        // findFirst : pas d'alerte TEMPERATURE active, mais une alerte HUMIDITY active
        mockAlert.findFirst.mockImplementation(({ where }) => {
            if (where?.type === 'HUMIDITY')
                return Promise.resolve(existingHumidityAlert);
            return Promise.resolve(null);
        });
        // Mesure conforme pour les deux
        await (0, alertService_1.checkAlerts)(measurementOk);
        // L'alerte HUMIDITY doit être résolue
        const updateCalls = mockAlert.update.mock.calls;
        (0, vitest_1.expect)(updateCalls.length).toBeGreaterThan(0);
        const humidityUpdate = updateCalls.find((c) => c[0]?.where?.id === 'alert-2');
        (0, vitest_1.expect)(humidityUpdate).toBeDefined();
        (0, vitest_1.expect)(humidityUpdate[0].data.resolvedAt).toBeInstanceOf(Date);
    });
});
// ─── C5 : Pays sans seuil configuré → rien ne se passe ───────────────────────
(0, vitest_1.describe)('checkAlerts – pays non configuré', () => {
    (0, vitest_1.it)('C5 – ignore silencieusement les mesures de pays sans seuil', async () => {
        await (0, alertService_1.checkAlerts)({ warehouseId: 'WH-XX-01', countryCode: 'XYZ', temperature: 50, humidity: 90 });
        (0, vitest_1.expect)(mockAlert.findFirst).not.toHaveBeenCalled();
        (0, vitest_1.expect)(mockAlert.create).not.toHaveBeenCalled();
    });
});
// ─── C_cycle : cycle complet alerte TEMPERATURE ───────────────────────────────
// Simule : hors plage → alerte créée → retour en plage → alerte résolue
// → hors plage à nouveau → nouvelle alerte possible
(0, vitest_1.describe)('checkAlerts – cycle complet alerte', () => {
    (0, vitest_1.it)('C_cycle – hors plage → résolution → nouvelle alerte créée', async () => {
        const createdAlert = { id: 'alert-cycle', type: 'TEMPERATURE', resolvedAt: null };
        // ─ Phase 1 : hors plage (33°C), aucune alerte active → création ────────
        mockAlert.findFirst.mockResolvedValue(null);
        await (0, alertService_1.checkAlerts)(measurementTempAlerte);
        (0, vitest_1.expect)(mockAlert.create).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(mockAlert.create.mock.calls[0][0].data.type).toBe('TEMPERATURE');
        (0, vitest_1.expect)(mockSendEmail).toHaveBeenCalledTimes(1);
        // ─ Phase 2 : dans la plage (28°C), alerte TEMPERATURE active → résolution
        vitest_1.vi.clearAllMocks();
        mockAlert.create.mockResolvedValue({});
        mockAlert.update.mockResolvedValue({});
        mockSendEmail.mockResolvedValue(undefined);
        mockAlert.findFirst.mockImplementation(({ where }) => where?.type === 'TEMPERATURE' ? Promise.resolve(createdAlert) : Promise.resolve(null));
        await (0, alertService_1.checkAlerts)(measurementOk);
        (0, vitest_1.expect)(mockAlert.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: { id: 'alert-cycle' },
            data: vitest_1.expect.objectContaining({ resolvedAt: vitest_1.expect.any(Date) }),
        }));
        (0, vitest_1.expect)(mockAlert.create).not.toHaveBeenCalled();
        // Pas d'email lors de la résolution
        (0, vitest_1.expect)(mockSendEmail).not.toHaveBeenCalled();
        // ─ Phase 3 : hors plage à nouveau, aucune alerte active → nouvelle alerte
        vitest_1.vi.clearAllMocks();
        mockAlert.create.mockResolvedValue({});
        mockAlert.findFirst.mockResolvedValue(null);
        mockSendEmail.mockResolvedValue(undefined);
        await (0, alertService_1.checkAlerts)(measurementTempAlerte);
        (0, vitest_1.expect)(mockAlert.create).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(mockSendEmail).toHaveBeenCalledTimes(1);
    });
});
