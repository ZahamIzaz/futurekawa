# FutureKawa – Mécanisme d'alerting (backend-country)

## Événements déclencheurs

| Déclencheur | Condition | Type d'alerte créé |
|---|---|---|
| Mesure MQTT reçue | Température hors plage | `TEMPERATURE` |
| Mesure MQTT reçue | Humidité hors plage | `HUMIDITY` |
| Vérification périodique (toutes les heures) | Lot stocké > 365 jours | `LOT_EXPIRED` |
| `POST /api/lots/check-expiry` | Lot stocké > 365 jours (déclenchement manuel) | `LOT_EXPIRED` |

---

## Seuils Brésil

Définis dans `src/config/thresholds.ts`.

| Paramètre | Valeur cible | Tolérance | Plage acceptable |
|---|---|---|---|
| Température | 29°C | ±3°C | 26°C – 32°C (bornes incluses) |
| Humidité | 55% | ±2% | 53% – 57% (bornes incluses) |
| Durée de stockage | — | — | 0 – 365 jours |

---

## Principe anti-doublon

### Alertes TEMPERATURE / HUMIDITY

- Une alerte est **active** tant que `resolvedAt` est `null`.
- Lors de chaque mesure reçue :
  - Si hors plage **et** aucune alerte active du même type → alerte créée + email envoyé
  - Si hors plage **et** alerte active existante → rien (pas de doublon)
  - Si dans la plage **et** alerte active → `resolvedAt` renseigné (résolution silencieuse)
- Après résolution, une nouvelle dérive peut créer une nouvelle alerte.

### Alertes LOT_EXPIRED

- Une seule alerte par lot : vérification via `lotId` (indépendamment de `resolvedAt`).
- Si l'alerte existe déjà, aucune nouvelle alerte n'est créée à la prochaine vérification.

---

## Emails envoyés

Un email est envoyé **uniquement lors de la création** d'une nouvelle alerte, jamais lors d'un doublon ou d'une résolution.

### Destinataire

Configuré par variable d'environnement selon le pays (fichier `src/config/email.ts`) :

| Pays | Variable d'environnement | Valeur par défaut |
|---|---|---|
| Brésil | `BRAZIL_MANAGER_EMAIL` | `responsable.bresil@futurekawa.local` |
| *(Équateur)* | `ECUADOR_MANAGER_EMAIL` | *(à configurer)* |
| *(Colombie)* | `COLOMBIA_MANAGER_EMAIL` | *(à configurer)* |

### Sujets des emails

| Type | Sujet |
|---|---|
| `TEMPERATURE` | `[FutureKawa][Brésil] Alerte TEMPERATURE - <warehouseId>` |
| `HUMIDITY` | `[FutureKawa][Brésil] Alerte HUMIDITY - <warehouseId>` |
| `LOT_EXPIRED` | `[FutureKawa][Brésil] Lot expiré - <lotId>` |

---

## Logs associés

| Événement | Log |
|---|---|
| Alerte créée | `[alert] HUMIDITY créée — BR-WH-01 : 52.9% hors plage [53-57]` |
| Alerte résolue | `[alert] HUMIDITY résolue — BR-WH-01` |
| Lot expiré | `[expiry] LOT_EXPIRED créé — lot <id> (BR-WH-01) : 400 jours` |
| Email envoyé | `[email] Alerte HUMIDITY envoyée à responsable.bresil@futurekawa.local` |
| Échec SMTP | `[email] Échec envoi HUMIDITY — BR-WH-01 : <message d'erreur>` |

> Un échec SMTP n'annule ni la mesure ni l'alerte en base.

---

## Serveur SMTP – MailHog (développement)

En environnement de démonstration, tous les emails sont interceptés par **MailHog**.

| Rôle | Adresse |
|---|---|
| Réception SMTP (interne Docker) | `mailhog:1025` |
| Interface Web (depuis le PC) | [http://localhost:8025](http://localhost:8025) |

Aucune authentification SMTP n'est requise avec MailHog.  
Les emails n'atteignent jamais de vrais destinataires.

### Consulter les emails

1. Démarrer la stack : `docker compose up -d`
2. Ouvrir [http://localhost:8025](http://localhost:8025) dans le navigateur
3. Les emails arriveront automatiquement dès qu'une alerte sera créée

---

## Variables d'environnement

| Variable | Docker (docker-compose) | Local (.env) |
|---|---|---|
| `SMTP_HOST` | `mailhog` | `localhost` |
| `SMTP_PORT` | `1025` | `1025` |
| `MAIL_FROM` | `alerts@futurekawa.local` | `alerts@futurekawa.local` |
| `BRAZIL_MANAGER_EMAIL` | `responsable.bresil@futurekawa.local` | `responsable.bresil@futurekawa.local` |
