"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ─── Hoisting du mock sendMail ─────────────────────────────────────────────────
// vi.hoisted garantit que la ref est créée AVANT les imports
const mockSendMail = vitest_1.vi.hoisted(() => vitest_1.vi.fn());
vitest_1.vi.mock('nodemailer', () => ({
    default: {
        createTransport: () => ({ sendMail: mockSendMail }),
    },
}));
// Mock config/email pour ne pas dépendre des variables d'environnement
vitest_1.vi.mock('../config/email', () => ({
    smtpConfig: { host: 'localhost', port: 1025, from: 'test@test.local' },
    MANAGER_EMAILS: {
        BRA: 'responsable.bresil@futurekawa.local',
    },
    COUNTRY_NAMES: { BRA: 'Brésil', XYZ: undefined },
}));
const email_service_1 = require("../services/email.service");
const basePayload = {
    countryCode: 'BRA',
    warehouseId: 'WH-BRA-01',
    measuredValue: 33,
    minAllowed: 26,
    maxAllowed: 32,
    createdAt: new Date('2026-08-13T12:00:00.000Z'),
};
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: 'test-id' });
});
// ─── D1 : envoie un email pour TEMPERATURE ────────────────────────────────────
(0, vitest_1.describe)('sendAlertEmail', () => {
    (0, vitest_1.it)('D1 – envoie un email pour une alerte TEMPERATURE', async () => {
        await (0, email_service_1.sendAlertEmail)({ ...basePayload, type: 'TEMPERATURE' });
        (0, vitest_1.expect)(mockSendMail).toHaveBeenCalledOnce();
        const callArg = mockSendMail.mock.calls[0][0];
        (0, vitest_1.expect)(callArg.to).toBe('responsable.bresil@futurekawa.local');
        (0, vitest_1.expect)(callArg.subject).toContain('TEMPERATURE');
        (0, vitest_1.expect)(callArg.subject).toContain('WH-BRA-01');
    });
    (0, vitest_1.it)('D2 – envoie un email pour une alerte HUMIDITY', async () => {
        await (0, email_service_1.sendAlertEmail)({ ...basePayload, type: 'HUMIDITY', measuredValue: 60 });
        (0, vitest_1.expect)(mockSendMail).toHaveBeenCalledOnce();
        const callArg = mockSendMail.mock.calls[0][0];
        (0, vitest_1.expect)(callArg.subject).toContain('HUMIDITY');
    });
    (0, vitest_1.it)('D3 – ne lance pas d\'exception si sendMail échoue', async () => {
        mockSendMail.mockRejectedValue(new Error('SMTP error'));
        // sendAlertEmail ne doit jamais throw
        await (0, vitest_1.expect)((0, email_service_1.sendAlertEmail)({ ...basePayload, type: 'TEMPERATURE' })).resolves.toBeUndefined();
    });
    (0, vitest_1.it)('D4 – n\'envoie pas d\'email si le pays n\'a pas de destinataire', async () => {
        await (0, email_service_1.sendAlertEmail)({ ...basePayload, type: 'TEMPERATURE', countryCode: 'XYZ' });
        (0, vitest_1.expect)(mockSendMail).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('D5 – envoie un email LOT_EXPIRED avec sujet adapté', async () => {
        await (0, email_service_1.sendAlertEmail)({
            ...basePayload,
            type: 'LOT_EXPIRED',
            lotId: 'lot-001',
            daysStored: 400,
            storageDate: new Date('2025-08-09T00:00:00.000Z'),
        });
        (0, vitest_1.expect)(mockSendMail).toHaveBeenCalledOnce();
        const callArg = mockSendMail.mock.calls[0][0];
        (0, vitest_1.expect)(callArg.subject).toContain('lot-001');
    });
});
