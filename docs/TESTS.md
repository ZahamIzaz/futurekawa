# Tests automatisés – FutureKawa MSPR Bloc 4

## Vue d'ensemble

| Package | Fichiers | Tests | Framework |
|---|---|---|---|
| `backend-country` | 6 | 37 | Vitest + Supertest |
| `backend-central` | 1 | 12 | Vitest + Supertest |
| `frontend` | 6 | 19 | Vitest + React Testing Library |
| **Total Vitest** | **13** | **68** | |
| E2E Playwright | 2 | 2 | Playwright + Chromium |
| **Total automatisé** | **15** | **70** | |

Les rapports JUnit générés par `npm run test:ci` (`*/test-results/junit.xml`) comptent 37, 12 et 19 tests, sans échec.

---

## Stratégie de tests

La stratégie combine quatre niveaux. Les trois premiers s'exécutent sans infrastructure externe, grâce à des mocks ; seul le quatrième utilise la stack réelle.

| Niveau | Outils | Périmètre | Tests |
|---|---|---|---|
| **Tests unitaires** | Vitest | Fonctions et services isolés : `getRange`, seuils BRA, `isLotExpired`, `checkAlerts`, `checkExpiredLots`, service email | Parties A, C, D (26 tests) |
| **Tests API / intégration logique avec mocks** | Vitest + Supertest | Routes Express des deux backends, de la requête HTTP à la réponse. Prisma (backend-country) et `httpClient` (backend-central) sont mockés. | Parties B et E (23 tests) |
| **Tests composants React** | Vitest + React Testing Library + jsdom | Rendu, interactions utilisateur, cas limites ; services API et Chart.js mockés | Partie F (19 tests) |
| **Tests E2E Playwright** | Playwright + Chromium | Parcours utilisateur sur la **stack Docker réelle**, via le frontend sur `http://localhost:5173` | Partie G (2 tests) |

### Ce que les tests automatisés ne couvrent pas

Les tests Vitest n'utilisent **ni PostgreSQL réel, ni broker MQTT réel, ni serveur SMTP réel** :

- Prisma est mocké (`vi.mock('../prisma')`) : les requêtes SQL et les migrations ne sont pas testées.
- `nodemailer` est mocké : aucun email n'est envoyé à MailHog.
- Le consumer MQTT (`mqttClient.ts`) n'a aucun test automatisé.
- Les routes `/api/alerts` et `/api/measurements` du backend-country n'ont pas de test dédié.

Ces aspects sont validés par les tests manuels, voir [MANUAL_TESTS.md](MANUAL_TESTS.md).

Les tests E2E valident la chaîne frontend → backend-central → backend-country → PostgreSQL. Ils ne valident pas directement MQTT ni SMTP : le consumer MQTT et l'envoi des emails ne sont pas contrôlés par ces tests.

## Lancer les tests

### Tests Vitest – tous les packages

`test:ci` exécute les tests et écrit le rapport JUnit `test-results/junit.xml` (c'est la commande utilisée par Jenkins).

```bash
# À la racine du projet
npm --prefix backend-country run test:ci   # 37 tests
npm --prefix backend-central run test:ci   # 12 tests
npm --prefix frontend run test:ci          # 19 tests
```

Pour un simple affichage console, `npm test` dans chaque package exécute les mêmes tests sans rapport JUnit.

### Tests E2E Playwright (stack Docker réelle requise)

Prérequis :

- `npm install` à la racine du projet (installe `@playwright/test`) ;
- stack démarrée avec `docker compose up -d --build` : le service `frontend` expose l'application sur `http://localhost:5173`, aucun serveur Vite séparé n'est nécessaire ;
- les backends, PostgreSQL et Mosquitto doivent être opérationnels.

```bash
# À la racine du projet
npx playwright install   # télécharge les navigateurs (une seule fois)
npx playwright test
```

Les E2E utilisent la stack réelle : le test G2 **crée un vrai lot** (`WH-E2E-<timestamp>`) en base, sans nettoyage automatique.

### Couverture de code

```bash
# À la racine du projet
npm --prefix backend-country run test:coverage
npm --prefix backend-central run test:coverage
npm --prefix frontend run test:coverage
```

---

## Jeux de données de test

Les valeurs sont définies directement dans les fichiers de tests (pas de fixtures partagées). Seuils de référence : Brésil 29 °C / 55 %, tolérance ±3 °C et ±2 %, soit 26–32 °C et 53–57 %.

### Température (BRA : 26–32 °C)

| Catégorie | Valeurs | Utilisé dans |
|---|---|---|
| Dans la plage | 26, 28, 29, 32 | A2c, C4, C_cycle |
| Hors plage | 25.9, 32.1, 33 | A2d, C1, C2, C3, C_cycle |

### Humidité (BRA : 53–57 %)

| Catégorie | Valeurs | Utilisé dans |
|---|---|---|
| Dans la plage | 53, 55, 57 | A2e, C1 à C4 (mesures conformes) |
| Hors plage | 52.9, 57.1 | A2f |

### Ancienneté des lots (date de référence : `2026-08-13T12:00:00.000Z`)

| Ancienneté | Résultat | Utilisé dans |
|---|---|---|
| 0 jour | Non expiré | A3d |
| 364 jours | Non expiré | A3c |
| 365 jours | Non expiré (limite non incluse) | A3b |
| 366 jours | Expiré | A3a, C6b |
| 400 jours | Expiré (alerte déjà existante) | C6c |

### Lots, pays et backends

| Donnée | Valeur | Utilisé dans |
|---|---|---|
| Lot valide | `lot-001` (`WH-BRA-01`, `BRA`, `COMPLIANT`) | B1, B5, E5, E7, tests frontend |
| Lot introuvable | `unknown` (Prisma renvoie `null`, ou le backend pays renvoie 404) | tests 404 de la partie B, E6 |
| Pays configuré | `BRA` | E1 à E9, D1, D2, C1 à C4 |
| Pays inconnu | `XXX` (backend-central), `XYZ` (backend-country) | E4, C5, D4 |
| Backend pays disponible | `httpGet` / `httpPost` renvoient une réponse | E2, E5 à E9 |
| Backend pays indisponible | `httpGet` rejette `BackendUnavailableError` | E3 |
| Corps de création invalide | sans `warehouseId` ; `storageDate: 'not-a-date'` | B2, B3 |
| Doublon | `lot.create` rejette une erreur de code `P2002` | B4 |
| E2E | entrepôt `WH-E2E-<timestamp>` (unique par exécution) | G2 |

---

## Critères de réussite

Une livraison est considérée conforme lorsque **tous** les critères suivants sont remplis :

| Critère | Condition |
|---|---|
| Compilation | `npm run build` réussit dans `backend-country`, `backend-central` et `frontend` |
| Tests Vitest | Aucun test en échec dans les trois packages (37 + 12 + 19) |
| Codes HTTP | Les statuts attendus sont renvoyés : 200, 201, 400, 404, 409, 503 selon les cas des parties B et E |
| Appels métier | Les appels attendus sont effectués : `alert.create`, `alert.update` (avec `resolvedAt`), `lot.update` (statut `EXPIRED`), `sendAlertEmail`, `httpGet` / `httpPost` avec la bonne URL |
| Absence de doublons | Aucune seconde alerte active pour un même type et un même entrepôt (C3, C6c) |
| UI conforme | Les composants affichent les données, les états vides et les erreurs attendus (partie F) |
| E2E | Les 2 tests Playwright passent sans erreur sur la stack Docker réelle |
| CI | Le build Jenkins est vert et les rapports JUnit sont publiés par le stage `Quality` |

---

## Gestion des anomalies et re-test

1. **Reproduire** : relancer le test en échec ou rejouer le scénario (test automatisé ou cas de [MANUAL_TESTS.md](MANUAL_TESTS.md)), relever le message d'erreur et les logs (`docker compose logs <service>`).
2. **Qualifier** : déterminer s'il s'agit d'un défaut du code, d'un test obsolète, d'un problème d'environnement (stack Docker, port occupé, base non initialisée) ou d'un test instable. Noter la gravité et le composant concerné.
3. **Corriger** : modifier le code (ou l'environnement) à l'origine de l'anomalie.
4. **Ajouter ou adapter le test** : ajouter un test qui échoue avant la correction et réussit après, ou mettre à jour un test devenu obsolète.
5. **Relancer le test concerné** : par exemple `npx vitest run src/__tests__/alertService.test.ts` dans le package touché.
6. **Relancer la suite** : `npm run test:ci` dans chaque package modifié, puis `npx playwright test` si l'interface ou les routes sont impactées.
7. **Vérifier Jenkins** : le pipeline doit être vert, le stage `Quality` doit publier les rapports JUnit et aucun test ne doit être en échec ou instable.

---

## Preuves d'exécution

| Élément | Résultat |
|---|---|
| Jenkins, build #3 | SUCCESS |
| Tests Vitest | 68/68 réussis (37 + 12 + 19) |
| Tests Playwright | 2/2 réussis (exécutés sur la stack Docker, hors pipeline Jenkins) |

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

Supertest sur l'app Express. Prisma mocké via `vi.mock('../prisma')` et `lotExpiryService` mocké pour éviter les effets de bord. Aucune base réelle n'est utilisée. Les tests sans ID dans le code sont notés « – ».

| ID | Route | Scénario | Code HTTP attendu |
|---|---|---|---|
| B1 | `POST /api/lots` | Corps valide | 201 + lot créé |
| B2 | `POST /api/lots` | `warehouseId` manquant | 400 |
| B3 | `POST /api/lots` | `storageDate` invalide | 400 |
| B4 | `POST /api/lots` | Doublon (code P2002) | 409 |
| B5 | `GET /api/lots` | Liste tous les lots | 200 + `{ data, count }` |
| – | `GET /api/lots/:id` | Lot trouvé | 200 |
| – | `GET /api/lots/:id` | Lot introuvable | 404 |
| – | `GET /api/lots/:id/measurements` | Lot avec mesures | 200 + `{ lotId, warehouseId, storageDate, data, count }` |
| – | `GET /api/lots/:id/measurements` | Lot introuvable | 404 |
| – | `POST /api/lots/check-expiry` | Déclenche la vérification (`checkExpiredLots` mocké) | 200 + `expiredCount` |
| – | `GET /health` | Santé du service | 200 + `{ status: 'ok', service: 'backend-country' }` |

Total : 11 tests.

---

## Partie C – Service d'alertes (backend-country)

### alertService

**Fichier :** `backend-country/src/__tests__/alertService.test.ts`

`checkAlerts()` mocké avec `vi.mock('../prisma')` + `vi.mock('../services/email.service')`.

| ID | Scénario | Comportement attendu |
|---|---|---|
| C1 | Température hors plage, aucune alerte active | `alert.create` appelé pour TEMPERATURE |
| C2 | Alerte créée | `sendAlertEmail` appelé avec le bon type et countryCode |
| C3 | Alerte active existante (hors plage) | Aucun doublon (`alert.create` et `sendAlertEmail` non appelés) |
| C4 | Mesure revenue dans la plage + alerte HUMIDITY active | `alert.update` appelé avec `resolvedAt` |
| C5 | Pays sans seuil configuré (XYZ) | Aucune action Prisma |
| C_cycle | Température hors plage → retour dans la plage → hors plage à nouveau | Alerte créée et email envoyé, puis alerte résolue (`alert.update` avec `resolvedAt`, sans nouvelle création), puis nouvelle alerte créée |

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
| E8b | `GET /api/countries/BRA/alerts?active=true` | Le paramètre `active=true` est transmis au backend pays | 200 |
| E8c | `GET /api/countries/BRA/alerts` | Sans `active=true`, le paramètre n'est pas transmis | 200 (non assertée par le test, qui contrôle l'URL appelée) |
| E9 | `POST /api/countries/BRA/lots` | Proxy création | 201 |
| – | `GET /health` | Santé du service | 200 + `{ status: 'ok', service: 'backend-central' }` |

Total : 12 tests. Le test E1 s'appuie sur la configuration réelle `COUNTRIES` (seul le Brésil est actif).

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

> Ces tests utilisent la **stack Docker réelle** (`docker compose up -d --build` : PostgreSQL, Mosquitto, backends, frontend) et accèdent à l'application sur `http://localhost:5173`. Aucun serveur Vite séparé n'est nécessaire. Ils ne sont pas exécutés par le pipeline Jenkins.

| ID | Fichier | Description |
|---|---|---|
| G1 | `consultation.spec.ts` | Sélectionner BRA dans `#country-select` → le tableau des lots (ou le message vide) apparaît |
| G2 | `creation.spec.ts` | Sélectionner BRA, ouvrir « Ajouter un lot », saisir un entrepôt unique, soumettre → le modal se ferme et une ligne supplémentaire apparaît dans le tableau |

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
