import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisting du mock sendMail ─────────────────────────────────────────────────
// vi.hoisted garantit que la ref est créée AVANT les imports
const mockSendMail = vi.hoisted(() => vi.fn());

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({ sendMail: mockSendMail }),
  },
}));

// Mock config/email pour ne pas dépendre des variables d'environnement
vi.mock('../config/email', () => ({
  smtpConfig: { host: 'localhost', port: 1025, from: 'test@test.local' },
  MANAGER_EMAILS: {
    BRA: 'responsable.bresil@futurekawa.local',
  },
  COUNTRY_NAMES: { BRA: 'Brésil', XYZ: undefined },
}));

import { sendAlertEmail } from '../services/email.service';

const basePayload = {
  countryCode: 'BRA',
  warehouseId: 'WH-BRA-01',
  measuredValue: 33,
  minAllowed: 26,
  maxAllowed: 32,
  createdAt: new Date('2026-08-13T12:00:00.000Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSendMail.mockResolvedValue({ messageId: 'test-id' });
});

// ─── D1 : envoie un email pour TEMPERATURE ────────────────────────────────────
describe('sendAlertEmail', () => {
  it('D1 – envoie un email pour une alerte TEMPERATURE', async () => {
    await sendAlertEmail({ ...basePayload, type: 'TEMPERATURE' });

    expect(mockSendMail).toHaveBeenCalledOnce();
    const callArg = mockSendMail.mock.calls[0][0];
    expect(callArg.to).toBe('responsable.bresil@futurekawa.local');
    expect(callArg.subject).toContain('TEMPERATURE');
    expect(callArg.subject).toContain('WH-BRA-01');
  });

  it('D2 – envoie un email pour une alerte HUMIDITY', async () => {
    await sendAlertEmail({ ...basePayload, type: 'HUMIDITY', measuredValue: 60 });

    expect(mockSendMail).toHaveBeenCalledOnce();
    const callArg = mockSendMail.mock.calls[0][0];
    expect(callArg.subject).toContain('HUMIDITY');
  });

  it('D3 – ne lance pas d\'exception si sendMail échoue', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'));

    // sendAlertEmail ne doit jamais throw
    await expect(sendAlertEmail({ ...basePayload, type: 'TEMPERATURE' })).resolves.toBeUndefined();
  });

  it('D4 – n\'envoie pas d\'email si le pays n\'a pas de destinataire', async () => {
    await sendAlertEmail({ ...basePayload, type: 'TEMPERATURE', countryCode: 'XYZ' });

    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('D5 – envoie un email LOT_EXPIRED avec sujet adapté', async () => {
    await sendAlertEmail({
      ...basePayload,
      type: 'LOT_EXPIRED',
      lotId: 'lot-001',
      daysStored: 400,
      storageDate: new Date('2025-08-09T00:00:00.000Z'),
    });

    expect(mockSendMail).toHaveBeenCalledOnce();
    const callArg = mockSendMail.mock.calls[0][0];
    expect(callArg.subject).toContain('lot-001');
  });
});
