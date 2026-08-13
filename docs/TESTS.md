# Tests automatisés – FutureKawa MSPR Bloc 4

## Vue d'ensemble

| Package | Fichiers | Tests | Framework |
|---|---|---|---|
| `backend-country` | 6 | 35 | Vitest + Supertest |
| `backend-central` | 1 | 9 | Vitest + Supertest |
| `frontend` | 6 | 19 | Vitest + React Testing Library |
| **Total unitaires** | **13** | **63** | |
| E2E | 2 | 2 | Playwright |

## Lancer les tests

### Tests unitaires – tous les packages

```bash
# backend-country (35 tests)
cd backend-country && npm test

# backend-central (9 tests)
cd backend-central && npm test

# frontend (19 tests)
cd frontend && npm test
```

### Tests E2E Playwright (stack Docker requise)

> Nécessite `docker compose up -d` ET le frontend Vite sur `http://localhost:5173`

```bash
# À la racine du projet
npx playwright test
```

### Couverture de code

```bash
cd backend-country && npm run test:coverage
cd backend-central && npm run test:coverage
cd frontend && npm run test:coverage
```

---

## Architecture des tests

### Refactoring préalable

Pour permettre l'import de l'application Express sans déclencher `app.listen()`, MQTT ou les tâches planifiées, chaque backend a été refactorisé :

- `src/app.ts` : crée et configure l'app Express, exporte `app` (sans `listen`)
- `src/index.ts` : importe `app` et démarre le serveur + effets de bord

---

## Partie A – Fonctions pures (backend-country)

### A1–A2 : `getRange` et seuils BRA

**Fichier :** `backend-country/src/__tests__/thresholds.test.ts`

| ID | Description | Résultat attendu |
|---|---|---|
| A1a | `getRange(29, 3)` | `{ min: 26, max: 32 }` |
| A1b | `getRange(20, 0)` | `{ min: 20, max: 20 }` |
| A2a | Plage température BRA | 26–32°C |
| A2b | Plage humidité BRA | 53–57% |
| A2c | Valeurs conformes température (26, 29, 32) | Dans la plage |
| A2d | Valeurs hors seuil température (25.9, 32.1) | Hors plage |
| A2e | Valeurs conformes humidité (53, 55, 57) | Dans la plage |
| A2f | Valeurs hors seuil humidité (52.9, 57.1) | Hors plage |

### A3 : `isLotExpired`

**Fichier :** `backend-country/src/__tests__/lotExpiry.test.ts`

Date de référence fixe : `2026-08-13T12:00:00.000Z`

| ID | Description | Résultat attendu |
|---|---|---|
| A3a | 366 jours | `true` (expiré) |
| A3b | 365 jours exactement | `false` (limite non inclusive) |
| A3c | 364 jours | `false` |
| A3d | storageDate = now | `false` |

---

## Partie B – API lots (backend-country)

**Fichier :** `backend-country/src/__tests__/lots.api.test.ts`

Supertest sur l'app Express. Prisma mocké via `vi.mock('../prisma')`.

| ID | Route | Scénario | Code HTTP attendu |
|---|---|---|---|
| B1 | `POST /api/lots` | Corps valide | 201 + lot créé |
| B2 | `POST /api/lots` | `warehouseId` manquant | 400 |
| B3 | `POST /api/lots` | `storageDate` invalide | 400 |
| B4 | `POST /api/lots` | Doublon (code P2002) | 409 |
| B5 | `GET /api/lots` | Liste tous les lots | 200 + `{ data, count }` |
| – | `GET /api/lots/:id` | Lot trouvé | 200 |
| – | `GET /api/lots/:id` | Lot introuvable | 404 |
| – | `GET /api/lots/:id/measurements` | Avec mesures | 200 + `{ lotId, warehouseId, storageDate, data, count }` |
| – | `POST /api/lots/check-expiry` | Déclenche vérification | 200 + `expiredCount` |

---

## Partie C – Service d'alertes (backend-country)

### alertService

**Fichier :** `backend-country/src/__tests__/alertService.test.ts`

`checkAlerts()` mocké avec `vi.mock('../prisma')` + `vi.mock('../services/email.service')`.

| ID | Scénario | Comportement attendu |
|---|---|---|
| C1 | Température hors plage, aucune alerte active | `alert.create` appelé pour TEMPERATURE |
| C2 | Alerte créée | `sendAlertEmail` appelé avec le bon type et countryCode |
| C3 | Alerte active existante (hors plage) | Aucun doublon (`alert.create` non appelé) |
| C4 | Mesure revenue dans la plage + alerte HUMIDITY active | `alert.update` appelé avec `resolvedAt` |
| C5 | Pays sans seuil configuré (XYZ) | Aucune action Prisma |

### checkExpiredLots

**Fichier :** `backend-country/src/__tests__/lotExpiryService.test.ts`

Utilise `vi.useFakeTimers({ toFake: ['Date'] })` pour contrôler `new Date()`.

| ID | Scénario | Résultat attendu |
|---|---|---|
| C6a | Aucun lot expiré | Retourne 0, aucun update |
| C6b | Lot de 366 jours, pas d'alerte existante | Retourne 1, `lot.update` + `alert.create` appelés |
| C6c | Lot de 400 jours, alerte LOT_EXPIRED déjà existante | Retourne 0, `alert.create` non appelé, `lot.update` appelé |

---

## Partie D – Service email (backend-country)

**Fichier :** `backend-country/src/__tests__/email.test.ts`

`nodemailer.createTransport` mocké via `vi.hoisted()` + `vi.mock('nodemailer')`. Config email mockée via `vi.mock('../config/email')`.

| ID | Scénario | Comportement attendu |
|---|---|---|
| D1 | Alerte TEMPERATURE pour BRA | `sendMail` appelé, sujet contient "TEMPERATURE" |
| D2 | Alerte HUMIDITY pour BRA | `sendMail` appelé, sujet contient "HUMIDITY" |
| D3 | Échec SMTP (exception interne) | `sendAlertEmail` ne relance pas l'erreur |
| D4 | Pays sans destinataire configuré (XYZ) | `sendMail` non appelé |
| D5 | Alerte LOT_EXPIRED avec lotId | Sujet contient le lotId |

---

## Partie E – API pays (backend-central)

**Fichier :** `backend-central/src/__tests__/countries.test.ts`

Supertest sur l'app Express. `httpClient` mocké via `vi.mock('../httpClient')`.

Les classes `BackendUnavailableError` et `BackendHttpError` sont définies dans la factory `vi.mock` pour éviter les problèmes de hoisting.

| ID | Route | Scénario | Code HTTP attendu |
|---|---|---|---|
| E1 | `GET /api/countries` | Liste des pays | 200 + `{ data: [{code, name}] }` |
| E2 | `GET /api/countries/BRA/lots` | Proxy réussi | 200 + réponse backend |
| E3 | `GET /api/countries/BRA/lots` | `BackendUnavailableError` | 503 + `{ error, countryCode }` |
| E4 | `GET /api/countries/XXX/lots` | Pays non configuré | 404 |
| E5 | `GET /api/countries/BRA/lots/lot-001` | Proxy lot | 200 |
| E6 | `GET /api/countries/BRA/lots/unknown` | `BackendHttpError(404)` | 404 transmis |
| E7 | `GET /api/countries/BRA/lots/lot-001/measurements` | Proxy mesures | 200 |
| E8 | `GET /api/countries/BRA/alerts` | Proxy alertes | 200 |
| E9 | `POST /api/countries/BRA/lots` | Proxy création | 201 |

---

## Partie F – Composants React (frontend)

**Framework :** Vitest + React Testing Library + jsdom

`react-chartjs-2` mocké globalement avec `vi.mock('react-chartjs-2', () => ({ Line: () => null }))`.

### SummaryCards

**Fichier :** `frontend/src/__tests__/SummaryCards.test.tsx`

| ID | Description |
|---|---|
| F2a | Affiche les compteurs corrects (total, conformes, expirés, alertes) |
| F2b | Affiche 0 sur toutes les cartes si liste vide |

### LotsTable

**Fichier :** `frontend/src/__tests__/LotsTable.test.tsx`

| ID | Description |
|---|---|
| F3 | Affiche "Aucun lot" si liste vide |
| F4a | Affiche les lots dans le tableau |
| F4b | Surligne la ligne du lot sélectionné (classe `row-selected`) |
| F4c | Appelle `onSelect` avec le bon lot au clic |
| F4d | Affiche les badges de statut corrects (Conforme, Expiré) |

### MeasurementsCharts

**Fichier :** `frontend/src/__tests__/MeasurementsCharts.test.tsx`

| ID | Description |
|---|---|
| F5 | Affiche "Aucune mesure" si liste vide |
| F6 | Rend deux graphiques `Line` quand des mesures sont présentes |

### AlertsPanel

**Fichier :** `frontend/src/__tests__/AlertsPanel.test.tsx`

| ID | Description |
|---|---|
| F7a | Affiche "Aucune alerte" si liste vide |
| F7b | Affiche une alerte TEMPERATURE avec les valeurs mesurées |
| F7c | Affiche une alerte LOT_EXPIRED avec le lotId |
| F7d | Affiche plusieurs alertes simultanément |

### App

**Fichier :** `frontend/src/__tests__/App.test.tsx`

`setInterval` spy pour désactiver l'auto-refresh de 10 s. Tous les services API mockés.

| ID | Description |
|---|---|
| F1 | Charge et affiche les pays au démarrage (`fetchCountries` appelé) |
| F8 | Affiche les lots après sélection d'un pays (`fetchLots` appelé) |

### CreateLotForm

**Fichier :** `frontend/src/__tests__/CreateLotForm.test.tsx`

| ID | Description |
|---|---|
| F9a | Affiche le formulaire avec le pays pré-rempli |
| F9b | Affiche une erreur si `warehouseId` est vide |
| F9c | Soumet le formulaire et appelle `onSuccess` |
| F9d | Affiche le message d'erreur si l'API échoue |

---

## Partie G – Tests E2E Playwright

**Dossier :** `e2e/`  
**Config :** `playwright.config.ts` (baseURL: `http://localhost:5173`, browser: Chromium)

> Ces tests nécessitent le stack Docker complet (`docker compose up -d`) et le frontend Vite en cours d'exécution.

| ID | Fichier | Description |
|---|---|---|
| G1 | `consultation.spec.ts` | Navigation : sélectionner BRA → liste des lots apparaît |
| G2 | `creation.spec.ts` | Créer un lot via le formulaire modal → modal se ferme |

---

## Décisions techniques

### Stratégie de mock Prisma

Les modules testés importent `prisma` au niveau module (même les fonctions pures comme `isLotExpired`). Il est donc **toujours nécessaire** de mocker `'../prisma'` dans les tests du `backend-country`, même quand la fonction testée n'utilise pas Prisma directement.

```typescript
vi.mock('../prisma', () => ({
  default: { lot: { findMany: vi.fn(), ... }, alert: { ... } },
}));
```

### Fake timers partiels

`vi.useFakeTimers()` sans options fake `process.nextTick` et `setImmediate`, ce qui empêche la résolution des Promises. On utilise systématiquement :

```typescript
vi.useFakeTimers({ toFake: ['Date'] }); // fake uniquement new Date()
```

Pour les tests frontend, on mocke `setInterval` directement :

```typescript
vi.spyOn(global, 'setInterval').mockReturnValue(0 as any);
```

### Classes d'erreur dans vi.mock (backend-central)

`BackendUnavailableError` et `BackendHttpError` sont définies **à l'intérieur** de la factory `vi.mock` pour éviter les erreurs de hoisting de Vitest :

```typescript
vi.mock('../httpClient', () => {
  class BackendUnavailableError extends Error { ... }
  class BackendHttpError extends Error { ... }
  return { BackendUnavailableError, BackendHttpError, httpGet: vi.fn(), httpPost: vi.fn() };
});
```

### Mock nodemailer avec vi.hoisted

Pour mocker `sendMail` avant l'initialisation du `transporter` (créé au niveau module), on utilise `vi.hoisted` :

```typescript
const mockSendMail = vi.hoisted(() => vi.fn());
vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: mockSendMail }) },
}));
```
