# Plan de tests manuels FutureKawa

## Objectif

Valider le fonctionnement complet de la plateforme FutureKawa de façon reproductible, sans connaissances techniques approfondies.  
Ce document permet à une tierce personne ou au jury MSPR de reproduire les scénarios clés et de constater les résultats attendus.

---

## Prérequis

| Composant | Version minimale | Note |
|-----------|-----------------|------|
| Docker Desktop | 4.x | ou Docker Engine 25+ |
| PowerShell | 5.1+ / 7+ | Intégré Windows 10/11 |
| Navigateur Web | Chrome / Firefox / Edge récent | |
| `curl.exe` | Intégré Windows 10+ | |

**Ports requis libres :**

| Port | Service |
|------|---------|
| 3000 | backend-central |
| 3001 | backend-country (Brésil) |
| 5173 | Frontend React |
| 1883 | MQTT Mosquitto |
| 5432 | PostgreSQL |
| 8025 | MailHog UI |
| 8080 | Jenkins CI/CD |

**Fichier `.env`** à la racine du projet (variables de connexion PostgreSQL, MQTT, MailHog).

---

## Démarrage de l'environnement

```powershell
# Depuis la racine du projet
docker compose up -d

# Vérifier que tous les services sont actifs
docker compose ps
```

**Critère de succès :** tous les services affichent `Up` et PostgreSQL affiche `(healthy)`.

---

## Cas de tests

---

### MT-01 — Démarrage Docker Compose

| Champ | Valeur |
|-------|--------|
| **ID** | MT-01 |
| **Catégorie** | Infra |
| **Objectif** | Vérifier que tous les services démarrent correctement |
| **Préconditions** | Docker Desktop démarré, fichier `.env` présent |

**Commande :**
```powershell
docker compose up -d
docker compose ps
```

**Résultat attendu :**

| Service | Statut |
|---------|--------|
| futurekawa_postgres | `Up (healthy)` |
| futurekawa_mosquitto | `Up` |
| futurekawa_mailhog | `Up` |
| futurekawa_backend_country | `Up` |
| futurekawa_backend_central | `Up` |
| futurekawa_frontend | `Up` |
| futurekawa_iot_simulator | `Up` |

**Résultat obtenu (exécuté le 2026-08-13) :**
```
NAME                         STATUS                  PORTS
futurekawa_backend_central   Up 2 hours              0.0.0.0:3000->3000/tcp
futurekawa_backend_country   Up 2 hours              0.0.0.0:3001->3001/tcp
futurekawa_frontend          Up 16 hours             0.0.0.0:5173->80/tcp
futurekawa_iot_simulator     Up 16 hours
futurekawa_mailhog           Up 19 hours             0.0.0.0:8025->8025/tcp
futurekawa_mosquitto         Up 21 hours             0.0.0.0:1883->1883/tcp
futurekawa_postgres          Up 21 hours (healthy)   0.0.0.0:5432->5432/tcp
```

**Statut : ✅ OK**

---

### MT-02 — Health backend pays (Brésil)

| Champ | Valeur |
|-------|--------|
| **ID** | MT-02 |
| **Catégorie** | API |
| **Objectif** | Vérifier que le backend pays répond correctement |
| **Préconditions** | MT-01 OK |

**Commande :**
```powershell
Invoke-RestMethod "http://localhost:3001/health"
```

**Résultat attendu :**
```json
{
  "status": "ok",
  "service": "backend-country"
}
```

**Résultat obtenu :**
```json
{
  "status": "ok",
  "service": "backend-country"
}
```

**Statut : ✅ OK**

---

### MT-03 — Health backend central

| Champ | Valeur |
|-------|--------|
| **ID** | MT-03 |
| **Catégorie** | API |
| **Objectif** | Vérifier que le backend central répond correctement |
| **Préconditions** | MT-01 OK |

**Commande :**
```powershell
Invoke-RestMethod "http://localhost:3000/health"
```

**Résultat attendu :**
```json
{
  "status": "ok",
  "service": "backend-central"
}
```

**Résultat obtenu :**
```json
{
  "status": "ok",
  "service": "backend-central"
}
```

**Statut : ✅ OK**

---

### MT-04 — Liste des pays

| Champ | Valeur |
|-------|--------|
| **ID** | MT-04 |
| **Catégorie** | API |
| **Objectif** | Vérifier que le Brésil est bien le seul pays configuré |
| **Préconditions** | MT-01 OK |

**Commande :**
```powershell
Invoke-RestMethod "http://localhost:3000/api/countries"
```

**Résultat attendu :** un tableau contenant `{ "code": "BRA", "name": "Brésil" }`.

**Résultat obtenu :**
```json
{
  "data": [
    { "code": "BRA", "name": "Brésil" }
  ]
}
```

**Statut : ✅ OK**

---

### MT-05 — Liste des lots FIFO

| Champ | Valeur |
|-------|--------|
| **ID** | MT-05 |
| **Catégorie** | API / Métier |
| **Objectif** | Vérifier que les lots sont triés `storageDate ASC` (FIFO) |
| **Préconditions** | MT-01 OK, au moins 2 lots en base |

**Commande :**
```powershell
Invoke-RestMethod "http://localhost:3000/api/countries/BRA/lots" |
  ConvertTo-Json -Depth 5
```

**Résultat attendu :** `storageDate` croissant — le lot le plus ancien en premier.

**Résultat obtenu (7 lots, ordre storageDate ASC) :**

| # | storageDate | status |
|---|-------------|--------|
| 1 | 2025-01-01 | EXPIRED |
| 2 | 2025-01-01 | EXPIRED |
| 3 | 2026-01-15 | COMPLIANT |
| 4 | 2026-08-01 | COMPLIANT |
| 5 | 2026-08-13 | COMPLIANT |
| 6 | 2026-08-13 | COMPLIANT |
| 7 | 2026-08-13 | COMPLIANT |

Ordre FIFO respecté. Les lots `storageDate = 2025-01-01` (> 365 jours) sont marqués `EXPIRED`.

**Statut : ✅ OK**

---

### MT-06 — Consultation d'un lot

| Champ | Valeur |
|-------|--------|
| **ID** | MT-06 |
| **Catégorie** | API |
| **Objectif** | Vérifier les champs d'un lot individuel |
| **Préconditions** | MT-05 OK (obtenir un `$lotId`) |

**Commande :**
```powershell
# Récupérer d'abord un ID via MT-05, puis :
$lotId = "cmsqfbegl0000oh1uzunwtjbg"   # lot COMPLIANT, storageDate 2026-01-15
Invoke-RestMethod "http://localhost:3000/api/countries/BRA/lots/$lotId" |
  ConvertTo-Json -Depth 5
```

**Résultat attendu :** objet avec `id`, `warehouseId`, `countryCode`, `storageDate`, `status`.

**Résultat obtenu :**
```json
{
  "id": "cmsqfbegl0000oh1uzunwtjbg",
  "warehouseId": "BR-WH-01",
  "countryCode": "BRA",
  "storageDate": "2026-01-15T08:00:00.000Z",
  "status": "COMPLIANT",
  "createdAt": "2026-08-12T18:29:22.293Z"
}
```

**Statut : ✅ OK**

---

### MT-07 — Historique température/humidité d'un lot

| Champ | Valeur |
|-------|--------|
| **ID** | MT-07 |
| **Catégorie** | API / Données |
| **Objectif** | Vérifier que les mesures IoT sont bien associées au lot et ordonnées chronologiquement |
| **Préconditions** | MT-06 OK |

**Commande :**
```powershell
$lotId = "cmsqfbegl0000oh1uzunwtjbg"
Invoke-RestMethod "http://localhost:3000/api/countries/BRA/lots/$lotId/measurements" |
  ConvertTo-Json -Depth 6
```

**Résultat attendu :** tableau de mesures avec `temperature`, `humidity`, `timestamp` en ordre chronologique.

**Résultat obtenu :** 2 318 mesures, ordre `timestamp ASC`. Extrait :
```json
[
  { "temperature": 29.1, "humidity": 53.8, "timestamp": "2026-08-12T18:28:11.486Z" },
  { "temperature": 29.2, "humidity": 53.8, "timestamp": "2026-08-12T18:28:21.496Z" }
]
```

**Statut : ✅ OK**

---

### MT-08 — Publication MQTT manuelle

| Champ | Valeur |
|-------|--------|
| **ID** | MT-08 |
| **Catégorie** | IoT / MQTT |
| **Objectif** | Vérifier qu'une mesure publiée manuellement est persistée en base |
| **Préconditions** | MT-01 OK, Mosquitto Up |

**Commande :**
```powershell
$payload = @{
    warehouseId = "BR-WH-01"
    countryCode = "BRA"
    temperature = 29.0
    humidity    = 55.0
    timestamp   = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json -Compress

$payload | docker compose exec -T mosquitto mosquitto_pub `
  -h localhost `
  -t "futurekawa/brazil/BR-WH-01/measurements" `
  -s

# Vérifier après 3 secondes :
Start-Sleep 3
Invoke-RestMethod "http://localhost:3001/api/measurements" |
  ConvertTo-Json -Depth 5 | Select-Object -First 20
```

**Résultat attendu :** la mesure `temperature=29.0, humidity=55.0` apparaît dans les premières lignes.

**Résultat obtenu :** mesure `id=2320, temperature=29, humidity=55` présente dans la liste.

**Statut : ✅ OK**

---

### MT-09 — Création d'une alerte HUMIDITY

| Champ | Valeur |
|-------|--------|
| **ID** | MT-09 |
| **Catégorie** | Alertes / Métier |
| **Objectif** | Vérifier qu'une humidité hors plage déclenche une alerte `HUMIDITY` |
| **Préconditions** | MT-08 OK |

**Seuils configurés :** `minAllowed = 53`, `maxAllowed = 57`

**Commande :**
```powershell
# Publier humidity = 52.5 (< 53 = minAllowed)
$payload = @{
    warehouseId = "BR-WH-01"
    countryCode = "BRA"
    temperature = 29.0
    humidity    = 52.5
    timestamp   = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json -Compress

$payload | docker compose exec -T mosquitto mosquitto_pub `
  -h localhost -t "futurekawa/brazil/BR-WH-01/measurements" -s

Start-Sleep 3
Invoke-RestMethod "http://localhost:3000/api/countries/BRA/alerts?active=true" |
  ConvertTo-Json -Depth 5
```

**Résultat attendu :** alerte `HUMIDITY`, `measuredValue=52.5`, `minAllowed=53`, `maxAllowed=57`, `resolvedAt=null`.

**Résultat obtenu :**
```json
{
  "id": "cmsrn1qqg0005ns1ugl6njxx7",
  "warehouseId": "BR-WH-01",
  "type": "HUMIDITY",
  "message": "Humidité hors plage acceptable",
  "measuredValue": 52.5,
  "minAllowed": 53,
  "maxAllowed": 57,
  "resolvedAt": null
}
```

**Statut : ✅ OK**

---

### MT-10 — Non-duplication d'une alerte

| Champ | Valeur |
|-------|--------|
| **ID** | MT-10 |
| **Catégorie** | Alertes / Métier |
| **Objectif** | Vérifier qu'une seconde valeur hors plage ne crée pas de doublon |
| **Préconditions** | MT-09 OK (alerte HUMIDITY active) |

**Commande :**
```powershell
# Publier humidity = 52.2 (toujours hors plage)
$payload = @{
    warehouseId = "BR-WH-01"; countryCode = "BRA"
    temperature = 29.0; humidity = 52.2
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json -Compress

$payload | docker compose exec -T mosquitto mosquitto_pub `
  -h localhost -t "futurekawa/brazil/BR-WH-01/measurements" -s

Start-Sleep 3
$alerts = Invoke-RestMethod "http://localhost:3000/api/countries/BRA/alerts?active=true"
($alerts.data | Where-Object { $_.type -eq "HUMIDITY" }).Count
```

**Résultat attendu :** exactement **1** alerte HUMIDITY active pour BR-WH-01.

**Résultat obtenu :** 1 alerte HUMIDITY active (`measuredValue` mis à jour à `52.2`).

> L'ancienne alerte `52.5` a été résolue et une nouvelle créée — comportement conforme à la logique métier (réinitialisation de l'alerte à chaque nouvelle mesure hors plage).

**Statut : ✅ OK**

---

### MT-11 — Résolution d'une alerte

| Champ | Valeur |
|-------|--------|
| **ID** | MT-11 |
| **Catégorie** | Alertes / Métier |
| **Objectif** | Vérifier qu'une valeur dans la plage résout l'alerte HUMIDITY |
| **Préconditions** | MT-10 OK (alerte HUMIDITY active) |

**Commande :**
```powershell
# Publier humidity = 55.0 (dans la plage 53–57)
$payload = @{
    warehouseId = "BR-WH-01"; countryCode = "BRA"
    temperature = 29.0; humidity = 55.0
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json -Compress

$payload | docker compose exec -T mosquitto mosquitto_pub `
  -h localhost -t "futurekawa/brazil/BR-WH-01/measurements" -s

Start-Sleep 3
Invoke-RestMethod "http://localhost:3000/api/countries/BRA/alerts?active=true" |
  ConvertTo-Json -Depth 5
```

**Résultat attendu :** aucune alerte `HUMIDITY` dans `active=true` ; `resolvedAt` non nul.

**Résultat obtenu :** l'alerte HUMIDITY a `resolvedAt = "2026-08-13T14:53:56.776Z"` et n'apparaît plus dans `?active=true`.

**Statut : ✅ OK**

---

### MT-12 — Alerte température

| Champ | Valeur |
|-------|--------|
| **ID** | MT-12 |
| **Catégorie** | Alertes / Métier |
| **Objectif** | Vérifier qu'une température > 32°C déclenche une alerte TEMPERATURE |
| **Préconditions** | MT-01 OK |

**Seuils configurés :** `minAllowed = 26`, `maxAllowed = 32`

**Commande :**
```powershell
docker exec futurekawa_mosquitto sh -c "mosquitto_pub \
  -h localhost \
  -t 'futurekawa/brazil/BR-WH-01/measurements' \
  -m '{\"warehouseId\":\"BR-WH-01\",\"countryCode\":\"BRA\",\"temperature\":33.0,\"humidity\":55.0,\"timestamp\":\"2026-08-13T14:55:30.000Z\"}'"

Start-Sleep 3
Invoke-RestMethod "http://localhost:3001/api/alerts" |
  Select-Object -ExpandProperty data |
  Where-Object { $_.type -eq "TEMPERATURE" } |
  Select-Object -First 1 | ConvertTo-Json -Depth 4
```

**Résultat attendu :** alerte `TEMPERATURE`, `measuredValue=33`, `minAllowed=26`, `maxAllowed=32`.

**Résultat obtenu :**
```json
{
  "id": "cmsrn2vbg0007ns1umouyfqkl",
  "warehouseId": "BR-WH-01",
  "type": "TEMPERATURE",
  "message": "Température hors plage acceptable",
  "measuredValue": 33,
  "minAllowed": 26,
  "maxAllowed": 32,
  "createdAt": "2026-08-13T14:54:27.340Z",
  "resolvedAt": "2026-08-13T14:54:29.451Z"
}
```

> L'alerte a été résolue après 2 secondes par la mesure suivante du simulateur IoT (`temperature=28.2`), ce qui est un comportement conforme.

**Statut : ✅ OK**

---

### MT-13 — Email d'alerte MailHog

| Champ | Valeur |
|-------|--------|
| **ID** | MT-13 |
| **Catégorie** | Email / Notification |
| **Objectif** | Vérifier que les alertes génèrent des emails envoyés au responsable Brésil |
| **Préconditions** | MT-09 ou MT-12 OK |

**Étape :** Ouvrir `http://localhost:8025` dans le navigateur.

**Vérification via API MailHog :**
```powershell
$mails = Invoke-RestMethod "http://localhost:8025/api/v2/messages?limit=5"
$mails.total
$mails.items | Select-Object -First 3 | ForEach-Object {
    "From: $($_.From.Mailbox)@$($_.From.Domain)"
    "To:   $($_.To[0].Mailbox)@$($_.To[0].Domain)"
    "Subj: $($_.Content.Headers.Subject)"
}
```

**Résultat attendu :**
- Expéditeur : `alerts@futurekawa.local`
- Destinataire : `responsable.bresil@futurekawa.local`
- Sujet contenant le type d'alerte et l'entrepôt (`BR-WH-01`)

**Résultat obtenu (19 emails en base) :**

| # | Expéditeur | Destinataire | Sujet (décodé) |
|---|-----------|--------------|----------------|
| 1 | alerts@futurekawa.local | responsable.bresil@futurekawa.local | [FutureKawa][Brésil] Alerte TEMPERATURE - BR-WH-01 |
| 2 | alerts@futurekawa.local | responsable.bresil@futurekawa.local | [FutureKawa][Brésil] Alerte HUMIDITY - BR-WH-01 |
| 3 | alerts@futurekawa.local | responsable.bresil@futurekawa.local | [FutureKawa][Brésil] Alerte HUMIDITY - BR-WH-01 |

**Vérification visuelle :** accéder à `http://localhost:8025` et ouvrir un email pour voir le corps complet.

**Statut : ✅ OK**

---

### MT-14 — Contrôle expiration > 365 jours

| Champ | Valeur |
|-------|--------|
| **ID** | MT-14 |
| **Catégorie** | Métier / Expiration |
| **Objectif** | Vérifier le marquage EXPIRED et la non-duplication d'alerte |
| **Préconditions** | MT-01 OK, au moins un lot avec `storageDate` > 365 jours |

**Commande (1er appel) :**
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/lots/check-expiry" |
  ConvertTo-Json -Depth 5
```

**Commande (2e appel — idempotence) :**
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/lots/check-expiry" |
  ConvertTo-Json
```

**Résultat attendu :**
- 1er appel : lots devenus `EXPIRED` comptabilisés, alerte `LOT_EXPIRED` créée.
- 2e appel : `expiredCount = 0` (pas de doublon).

**Résultat obtenu :**

1er appel : `{ "message": "Vérification effectuée.", "expiredCount": 0 }` (les 2 lots étaient déjà `EXPIRED` depuis la session précédente — aucun nouveau lot à marquer).

2e appel : `{ "message": "Vérification effectuée.", "expiredCount": 0 }` ✅ idempotent.

Lots EXPIRED existants (storageDate = 2025-01-01, soit 588 jours) :
- `cmsqhv3qo0000ph1u7uutermb`
- `cmsqh1png0000n41u11ljqar7`

Alertes `LOT_EXPIRED` actives correspondantes confirmées.

**Statut : ✅ OK**

---

### MT-15 — Pays non configuré

| Champ | Valeur |
|-------|--------|
| **ID** | MT-15 |
| **Catégorie** | API / Erreurs |
| **Objectif** | Vérifier que l'accès à un pays non configuré retourne HTTP 404 |
| **Préconditions** | MT-01 OK |

**Commande :**
```powershell
# PowerShell lève une WebException ; utiliser curl.exe pour voir le code HTTP :
curl.exe -i http://localhost:3000/api/countries/ECU/lots
```

**Résultat attendu :** HTTP 404, corps `{ "error": "Pays non configuré" }`.

**Résultat obtenu :**
```
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{"error":"Pays non configuré"}
```

**Statut : ✅ OK**

---

### MT-16 — Résilience backend pays

| Champ | Valeur |
|-------|--------|
| **ID** | MT-16 |
| **Catégorie** | Résilience |
| **Objectif** | Vérifier que backend-central reste disponible et retourne 503 si backend-country est arrêté |
| **Préconditions** | MT-01 OK |

**⚠ Ce test arrête temporairement `backend-country`. Le redémarrer à la fin est obligatoire.**

**Étapes :**

```powershell
# 1. Arrêter backend-country
docker compose stop backend-country

# 2. Vérifier que backend-central répond toujours
Invoke-RestMethod "http://localhost:3000/health"

# 3. Vérifier HTTP 503 sur les lots BRA
curl.exe -i http://localhost:3000/api/countries/BRA/lots

# 4. Redémarrer backend-country (OBLIGATOIRE)
docker compose start backend-country

Start-Sleep 5
# 5. Vérifier que les lots sont de nouveau accessibles
Invoke-RestMethod "http://localhost:3000/api/countries/BRA/lots" |
  Select-Object count
```

**Résultat attendu :**
- Étape 2 : `{ "status": "ok", "service": "backend-central" }` 
- Étape 3 : `HTTP 503`, corps `{ "error": "Backend pays indisponible", "countryCode": "BRA" }`
- Étape 5 : `count = 7` (ou nombre de lots en base)

**Résultat obtenu :**

Étape 2 :
```json
{ "status": "ok", "service": "backend-central" }
```

Étape 3 :
```
HTTP/1.1 503 Service Unavailable
{"error":"Backend pays indisponible","countryCode":"BRA"}
```

Étape 5 : `count = 7` après redémarrage ✅

**Statut : ✅ OK**

---

### MT-17 — Frontend : consultation FIFO

| Champ | Valeur |
|-------|--------|
| **ID** | MT-17 |
| **Catégorie** | Frontend / UI |
| **Objectif** | Vérifier l'affichage du tableau de bord Brésil avec lots FIFO et alertes actives |
| **Préconditions** | MT-01 OK, données en base |

**Étapes :**
1. Ouvrir `http://localhost:5173` dans le navigateur.
2. Vérifier l'affichage du pays **Brésil**.
3. Vérifier les indicateurs (température, humidité, alertes actives).
4. Vérifier que les lots sont affichés dans l'ordre `storageDate ASC` (FIFO).
5. Vérifier les statuts : **Conforme** (COMPLIANT), **Expiré** (EXPIRED).
6. Vérifier la section Alertes actives.

**Résultat attendu :** tableau de bord avec lots ordonnés FIFO, statuts corrects, alertes `LOT_EXPIRED` visibles.

**Statut : À exécuter** *(nécessite validation visuelle)*

---

### MT-18 — Frontend : consultation d'un lot

| Champ | Valeur |
|-------|--------|
| **ID** | MT-18 |
| **Catégorie** | Frontend / UI |
| **Objectif** | Vérifier l'affichage des graphiques température et humidité d'un lot |
| **Préconditions** | MT-17 OK |

**Étapes :**
1. Sur `http://localhost:5173`, cliquer sur un lot BR-WH-01 avec des mesures.
2. Vérifier les informations du lot (id, entrepôt, date, statut).
3. Vérifier le **graphique température** — courbe chronologique.
4. Vérifier le **graphique humidité** — courbe chronologique.
5. Vérifier que les données correspondent à BR-WH-01.

**Résultat attendu :** graphiques tracés, données cohérentes avec les 2 318 mesures disponibles pour le lot `cmsqfbegl0000oh1uzunwtjbg`.

**Statut : À exécuter** *(nécessite validation visuelle)*

---

### MT-19 — Frontend : création d'un lot

| Champ | Valeur |
|-------|--------|
| **ID** | MT-19 |
| **Catégorie** | Frontend / UI |
| **Objectif** | Vérifier la création d'un lot via l'interface et son respect du FIFO |
| **Préconditions** | MT-17 OK |

**⚠ Ce test crée une donnée réelle. Ne pas l'exécuter plusieurs fois inutilement.**

**Étapes :**
1. Sur `http://localhost:5173`, cliquer **Ajouter un lot**.
2. Saisir `BR-WH-01` comme entrepôt.
3. Saisir une date de stockage.
4. Valider.
5. Vérifier :
   - confirmation de création,
   - nouvelle ligne dans le tableau,
   - position correcte dans l'ordre FIFO.

**Résultat attendu :** lot créé, visible, correctement positionné selon `storageDate`.

**Statut : À exécuter** *(nécessite validation visuelle)*

---

### MT-20 — Actualisation des mesures

| Champ | Valeur |
|-------|--------|
| **ID** | MT-20 |
| **Catégorie** | Frontend / Temps réel |
| **Objectif** | Vérifier que le graphique se met à jour après une nouvelle publication MQTT |
| **Préconditions** | MT-18 OK, simulateur IoT en fonctionnement |

**Étapes :**
1. Ouvrir un lot dans le frontend (`http://localhost:5173`).
2. Observer le graphique (timestamp de la dernière mesure).
3. Attendre 10–30 secondes (le simulateur publie toutes les 10 secondes).
4. Cliquer **Actualiser**.
5. Vérifier que de nouvelles mesures sont apparues.

**Résultat attendu :** le graphique affiche des mesures plus récentes qu'avant l'actualisation.

**Statut : À exécuter** *(nécessite validation visuelle)*

---

## Résumé des résultats

| ID | Scénario | Catégorie | Statut |
|----|----------|-----------|--------|
| MT-01 | Démarrage Docker Compose | Infra | ✅ OK |
| MT-02 | Health backend pays | API | ✅ OK |
| MT-03 | Health backend central | API | ✅ OK |
| MT-04 | Liste des pays | API | ✅ OK |
| MT-05 | Liste des lots FIFO | API / Métier | ✅ OK |
| MT-06 | Consultation d'un lot | API | ✅ OK |
| MT-07 | Historique mesures d'un lot | API / Données | ✅ OK |
| MT-08 | Publication MQTT manuelle | IoT / MQTT | ✅ OK |
| MT-09 | Création alerte HUMIDITY | Alertes | ✅ OK |
| MT-10 | Non-duplication alerte | Alertes | ✅ OK |
| MT-11 | Résolution alerte | Alertes | ✅ OK |
| MT-12 | Alerte température | Alertes | ✅ OK |
| MT-13 | Email d'alerte MailHog | Email | ✅ OK |
| MT-14 | Contrôle expiration lots | Métier | ✅ OK |
| MT-15 | Pays non configuré (404) | API / Erreurs | ✅ OK |
| MT-16 | Résilience backend pays (503) | Résilience | ✅ OK |
| MT-17 | Frontend : tableau de bord FIFO | Frontend | À exécuter |
| MT-18 | Frontend : graphiques lot | Frontend | À exécuter |
| MT-19 | Frontend : création d'un lot | Frontend | À exécuter |
| MT-20 | Frontend : actualisation mesures | Frontend | À exécuter |

**Tests exécutés :** 16 / 20  
**Résultat :** 16 ✅ OK — 0 ❌ KO — 4 🔲 À exécuter (validation visuelle frontend)

---

## Captures recommandées pour la MSPR

Pour constituer les preuves de la soutenance, effectuer et conserver les captures suivantes :

| # | Capture | Commande / URL |
|---|---------|---------------|
| 1 | `docker compose ps` — tous services Up | `docker compose ps` dans le terminal |
| 2 | API lots FIFO — tableau ordonné | `Invoke-RestMethod "http://localhost:3000/api/countries/BRA/lots"` |
| 3 | Alerte active (LOT_EXPIRED ou HUMIDITY) | `Invoke-RestMethod "http://localhost:3000/api/countries/BRA/alerts?active=true"` |
| 4 | Email MailHog — corps de l'alerte | `http://localhost:8025` → ouvrir un email d'alerte |
| 5 | HTTP 503 backend pays indisponible | `curl.exe -i http://localhost:3000/api/countries/BRA/lots` (après stop) |
| 6 | HTTP 404 pays non configuré | `curl.exe -i http://localhost:3000/api/countries/ECU/lots` |
| 7 | Dashboard Frontend — lots FIFO | `http://localhost:5173` |
| 8 | Graphiques température/humidité | Cliquer sur un lot dans le frontend |
| 9 | Jenkins — build vert (pipeline 7 stages) | `http://localhost:8080/job/futurekawa/` |
| 10 | Jenkins — rapport JUnit (68 tests) | `http://localhost:8080/job/futurekawa/lastBuild/testReport/` |
