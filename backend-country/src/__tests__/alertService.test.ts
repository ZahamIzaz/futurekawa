import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../prisma', () => ({
  default: {
    alert: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../services/email.service', () => ({
  sendAlertEmail: vi.fn().mockResolvedValue(undefined),
}));

import { checkAlerts } from '../alertService';
import prisma from '../prisma';
import { sendAlertEmail } from '../services/email.service';

const mockAlert = prisma.alert as unknown as {
  findFirst: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};
const mockSendEmail = sendAlertEmail as ReturnType<typeof vi.fn>;

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

beforeEach(() => {
  vi.clearAllMocks();
  mockAlert.create.mockResolvedValue({});
  mockAlert.update.mockResolvedValue({});
  mockSendEmail.mockResolvedValue(undefined);
});

// ─── C1 : Création d'alerte si hors plage et aucune alerte active ─────────────
describe('checkAlerts – création alerte', () => {
  it('C1 – crée une alerte TEMPERATURE si hors plage et aucune alerte active', async () => {
    // findFirst retourne null pour TEMPERATURE (pas d'alerte), et null pour HUMIDITY
    mockAlert.findFirst.mockResolvedValue(null);

    await checkAlerts(measurementTempAlerte);

    // prisma.alert.create doit avoir été appelé pour TEMPERATURE
    const createCalls = mockAlert.create.mock.calls;
    const tempCreate = createCalls.find((c: any[]) => c[0]?.data?.type === 'TEMPERATURE');
    expect(tempCreate).toBeDefined();
    expect(tempCreate[0].data.measuredValue).toBe(33);
  });
});

// ─── C2 : Email envoyé lors de la création ────────────────────────────────────
describe('checkAlerts – envoi email', () => {
  it('C2 – envoie un email lors de la création d\'alerte', async () => {
    mockAlert.findFirst.mockResolvedValue(null);

    await checkAlerts(measurementTempAlerte);

    expect(mockSendEmail).toHaveBeenCalled();
    const callArg = mockSendEmail.mock.calls[0][0];
    expect(callArg.type).toBe('TEMPERATURE');
    expect(callArg.countryCode).toBe('BRA');
  });
});

// ─── C3 : Pas de doublon si alerte active existe déjà ─────────────────────────
describe('checkAlerts – déduplication', () => {
  it('C3 – ne crée pas de doublon si alerte active existe', async () => {
    // findFirst retourne une alerte active existante
    const existingAlert = { id: 'alert-1', type: 'TEMPERATURE', resolvedAt: null };
    mockAlert.findFirst.mockResolvedValue(existingAlert);

    await checkAlerts(measurementTempAlerte);

    expect(mockAlert.create).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});

// ─── C4 : Résolution d'alerte si mesure revenue dans les plages ───────────────
describe('checkAlerts – résolution', () => {
  it('C4 – résout l\'alerte active quand la mesure revient dans la plage', async () => {
    const existingHumidityAlert = { id: 'alert-2', type: 'HUMIDITY', resolvedAt: null };
    // findFirst : pas d'alerte TEMPERATURE active, mais une alerte HUMIDITY active
    mockAlert.findFirst.mockImplementation(({ where }: any) => {
      if (where?.type === 'HUMIDITY') return Promise.resolve(existingHumidityAlert);
      return Promise.resolve(null);
    });

    // Mesure conforme pour les deux
    await checkAlerts(measurementOk);

    // L'alerte HUMIDITY doit être résolue
    const updateCalls = mockAlert.update.mock.calls;
    expect(updateCalls.length).toBeGreaterThan(0);
    const humidityUpdate = updateCalls.find((c: any[]) => c[0]?.where?.id === 'alert-2');
    expect(humidityUpdate).toBeDefined();
    expect(humidityUpdate[0].data.resolvedAt).toBeInstanceOf(Date);
  });
});

// ─── C5 : Pays sans seuil configuré → rien ne se passe ───────────────────────
describe('checkAlerts – pays non configuré', () => {
  it('C5 – ignore silencieusement les mesures de pays sans seuil', async () => {
    await checkAlerts({ warehouseId: 'WH-XX-01', countryCode: 'XYZ', temperature: 50, humidity: 90 });

    expect(mockAlert.findFirst).not.toHaveBeenCalled();
    expect(mockAlert.create).not.toHaveBeenCalled();
  });
});

// ─── C_cycle : cycle complet alerte TEMPERATURE ───────────────────────────────
// Simule : hors plage → alerte créée → retour en plage → alerte résolue
// → hors plage à nouveau → nouvelle alerte possible
describe('checkAlerts – cycle complet alerte', () => {
  it('C_cycle – hors plage → résolution → nouvelle alerte créée', async () => {
    const createdAlert = { id: 'alert-cycle', type: 'TEMPERATURE', resolvedAt: null };

    // ─ Phase 1 : hors plage (33°C), aucune alerte active → création ────────
    mockAlert.findFirst.mockResolvedValue(null);
    await checkAlerts(measurementTempAlerte);

    expect(mockAlert.create).toHaveBeenCalledTimes(1);
    expect(mockAlert.create.mock.calls[0][0].data.type).toBe('TEMPERATURE');
    expect(mockSendEmail).toHaveBeenCalledTimes(1);

    // ─ Phase 2 : dans la plage (28°C), alerte TEMPERATURE active → résolution
    vi.clearAllMocks();
    mockAlert.create.mockResolvedValue({});
    mockAlert.update.mockResolvedValue({});
    mockSendEmail.mockResolvedValue(undefined);
    mockAlert.findFirst.mockImplementation(({ where }: any) =>
      where?.type === 'TEMPERATURE' ? Promise.resolve(createdAlert) : Promise.resolve(null),
    );
    await checkAlerts(measurementOk);

    expect(mockAlert.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'alert-cycle' },
        data: expect.objectContaining({ resolvedAt: expect.any(Date) }),
      }),
    );
    expect(mockAlert.create).not.toHaveBeenCalled();
    // Pas d'email lors de la résolution
    expect(mockSendEmail).not.toHaveBeenCalled();

    // ─ Phase 3 : hors plage à nouveau, aucune alerte active → nouvelle alerte
    vi.clearAllMocks();
    mockAlert.create.mockResolvedValue({});
    mockAlert.findFirst.mockResolvedValue(null);
    mockSendEmail.mockResolvedValue(undefined);
    await checkAlerts(measurementTempAlerte);

    expect(mockAlert.create).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });
});
