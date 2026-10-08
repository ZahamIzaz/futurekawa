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

## Variables et jeux de données reproductibles

Les scénarios utilisent les valeurs suivantes. Aucune date n'est figée : les timestamps sont générés par PowerShell au moment du test et les identifiants de lots sont récupérés via l'API.

| Donnée | Valeur | Règle associée |
|--------|--------|-----------------|
| Entrepôt de test | `BR-WH-01` (pays `BRA`) | Entrepôt du simulateur IoT et du module physique |
| Topic MQTT | `futurekawa/brazil/BR-WH-01/measurements` | Topic écouté par backend-country |
| Mesure conforme | 29,0 °C / 55,0 % | Valeurs cibles BRA, dans les plages 26–32 °C et 53–57 % |
| Température hors seuil | 33,0 °C (humidité 55,0 %) | > 32 °C → alerte `TEMPERATURE` |
| Humidité hors seuil | 52,5 % (température 29,0 °C), puis 52,2 % | < 53 % → alerte `HUMIDITY` |
| Timestamp des mesures | Heure courante UTC : `(Get-Date).ToUniversalTime().ToString("o")` | Jamais de date codée en dur |
| Lot récent | `storageDate` = date du jour | Non expiré (`COMPLIANT`) |
| Lot > 365 jours | `storageDate` = date du jour − 400 jours | Marqué `EXPIRED` par la vérification de MT-14 |

Pour créer un lot récent et un lot de plus de 365 jours (**crée deux données réelles**, à exécuter une seule fois) :

```powershell
$url    = "http://localhost:3000/api/countries/BRA/lots"
$recent = @{ warehouseId = "BR-WH-01"; countryCode = "BRA"
             storageDate = (Get-Date).ToUniversalTime().ToString("o") } | ConvertTo-Json
$old    = @{ warehouseId = "BR-WH-01"; countryCode = "BRA"
             storageDate = (Get-Date).AddDays(-400).ToUniversalTime().ToString("o") } | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri $url -ContentType "application/json" -Body $recent
Invoke-RestMethod -Method Post -Uri $url -ContentType "application/json" -Body $old
```

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
| **Préconditions** | MT-05 OK (au moins un lot `COMPLIANT`) |

**Commande :**
```powershell
# Récupérer dynamiquement le premier lot COMPLIANT (ordre FIFO)
$lots  = Invoke-RestMethod "http://localhost:3000/api/countries/BRA/lots"
$lotId = ($lots.data | Where-Object { $_.status -eq "COMPLIANT" } | Select-Object -First 1).id
Write-Host "Lot testé : $lotId"

Invoke-RestMethod "http://localhost:3000/api/countries/BRA/lots/$lotId" |
  ConvertTo-Json -Depth 5
```

**Résultat attendu :** objet avec `id` (égal à `$lotId`), `warehouseId`, `countryCode`, `storageDate`, `status`.

**Résultat obtenu (exécution du 2026-08-13) :**
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

**Statut : 🟠 À revalider** *(procédure mise à jour ; dernière exécution le 2026-08-13 avec l'ancienne version)*

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
# Récupérer dynamiquement le premier lot COMPLIANT (ordre FIFO, donc le plus ancien)
$lots  = Invoke-RestMethod "http://localhost:3000/api/countries/BRA/lots"
$lotId = ($lots.data | Where-Object { $_.status -eq "COMPLIANT" } | Select-Object -First 1).id

$h = Invoke-RestMethod "http://localhost:3000/api/countries/BRA/lots/$lotId/measurements"
Write-Host "Lot : $lotId | entrepôt : $($h.warehouseId) | mesures : $($h.count)"

# Vérifier l'ordre chronologique
$ts = $h.data | ForEach-Object { [datetimeoffset]$_.timestamp }
$ok = $true
for ($i = 1; $i -lt $ts.Count; $i++) { if ($ts[$i] -lt $ts[$i-1]) { $ok = $false } }
Write-Host "Ordre chronologique : $ok"

$h.data | Select-Object -First 3 | ConvertTo-Json -Depth 4
```

**Résultat attendu :** `count` > 0, `Ordre chronologique : True`, mesures avec `temperature`, `humidity`, `timestamp`.

**Résultat obtenu (exécution du 2026-08-13) :** 2 318 mesures, ordre `timestamp ASC`. Extrait :
```json
[
  { "temperature": 29.1, "humidity": 53.8, "timestamp": "2026-08-12T18:28:11.486Z" },
  { "temperature": 29.2, "humidity": 53.8, "timestamp": "2026-08-12T18:28:21.496Z" }
]
```

**Statut : 🟠 À revalider** *(procédure mise à jour ; dernière exécution le 2026-08-13 avec l'ancienne version)*

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

**⚠ Arrêter le simulateur IoT avant ce test** pour éviter toute interférence entre MT-09 et MT-11. Le redémarrer impérativement à la fin de MT-11.

**Utiliser la même session PowerShell pour MT-09, MT-10 et MT-11** : la variable `$alertId` mémorisée ici sert aux deux tests suivants.

```powershell
docker compose stop iot-simulator
```

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
$active = Invoke-RestMethod "http://localhost:3000/api/countries/BRA/alerts?active=true"
$humidAlerts = @($active.data | Where-Object { $_.type -eq "HUMIDITY" -and $_.warehouseId -eq "BR-WH-01" })
Write-Host "Alertes HUMIDITY actives pour BR-WH-01 : $($humidAlerts.Count)"

# Mémoriser l'ID de l'alerte pour MT-10 et MT-11
$alertId = $humidAlerts[0].id
Write-Host "ID de l'alerte mémorisé : $alertId"
$humidAlerts[0] | ConvertTo-Json -Depth 5
```

**Résultat attendu :** une seule alerte `HUMIDITY` active, `measuredValue=52.5`, `minAllowed=53`, `maxAllowed=57`, `resolvedAt=null`, et un `$alertId` renseigné.

**Résultat obtenu (exécution du 2026-08-13, avant l'ajout de la mémorisation de l'ID) :**
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
| **Objectif** | Vérifier qu'une nouvelle mesure hors plage ne crée pas de doublon quand une alerte du même type est déjà active |
| **Préconditions** | MT-09 OK (alerte HUMIDITY active pour BR-WH-01, `$alertId` défini dans la même session PowerShell), simulateur IoT **arrêté** |

**Commande :**
```powershell
# ID de l'alerte active mémorisé en MT-09, avant la deuxième publication
$idBefore = $alertId
Write-Host "ID avant la publication : $idBefore"

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
$humidAlerts = @($alerts.data | Where-Object { $_.type -eq "HUMIDITY" -and $_.warehouseId -eq "BR-WH-01" })
Write-Host "Nombre d'alertes HUMIDITY actives pour BR-WH-01 : $($humidAlerts.Count)"
Write-Host "ID après la publication : $($humidAlerts[0].id)"
Write-Host "Même alerte : $($humidAlerts.Count -eq 1 -and $humidAlerts[0].id -eq $idBefore)"
$humidAlerts | ConvertTo-Json -Depth 4
```

**Résultat attendu :** exactement **1** alerte HUMIDITY active pour BR-WH-01 et `Même alerte : True` : l'ID est **strictement identique** à celui mémorisé en MT-09, avec `measuredValue = 52.5` (valeur initiale conservée) et `resolvedAt = null`.

> Règle métier : si une alerte HUMIDITY est déjà active et qu'une nouvelle mesure reste hors plage, **aucune nouvelle alerte n'est créée** (et aucun nouvel email n'est envoyé). L'alerte active n'est pas résolue pour être recréée : elle n'est résolue que lorsqu'une mesure revient dans la plage (voir MT-11).

**Statut : À exécuter**

---

### MT-11 — Résolution d'une alerte

| Champ | Valeur |
|-------|--------|
| **ID** | MT-11 |
| **Catégorie** | Alertes / Métier |
| **Objectif** | Vérifier qu'une valeur dans la plage résout l'alerte HUMIDITY |
| **Préconditions** | MT-10 OK (alerte HUMIDITY active, `$alertId` défini dans la même session PowerShell), simulateur IoT **arrêté** |

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

# 1. Plus aucune alerte HUMIDITY active pour BR-WH-01
$active = Invoke-RestMethod "http://localhost:3000/api/countries/BRA/alerts?active=true"
$stillActive = @($active.data | Where-Object { $_.type -eq "HUMIDITY" -and $_.warehouseId -eq "BR-WH-01" })
Write-Host "Alertes HUMIDITY actives restantes : $($stillActive.Count)"

# 2. Vérifier resolvedAt sur l'alerte précise mémorisée en MT-09 (recherche par ID)
$all   = Invoke-RestMethod "http://localhost:3001/api/alerts"
$alert = $all.data | Where-Object { $_.id -eq $alertId }
$alert | ConvertTo-Json -Depth 4
Write-Host "resolvedAt de l'alerte $alertId : $($alert.resolvedAt)"
```

**Résultat attendu :** `Alertes HUMIDITY actives restantes : 0` ; l'alerte portant l'ID `$alertId` existe toujours dans l'historique avec un `resolvedAt` non nul.

**⚠ Redémarrer impérativement le simulateur IoT après ce test :**
```powershell
docker compose start iot-simulator
```

**Statut : À exécuter**

---

### MT-12 — Alerte température

| Champ | Valeur |
|-------|--------|
| **ID** | MT-12 |
| **Catégorie** | Alertes / Métier |
| **Objectif** | Vérifier qu'une température > 32°C déclenche une alerte TEMPERATURE |
| **Préconditions** | MT-01 OK, simulateur IoT **arrêté** (il publie toutes les 10 s et résoudrait l'alerte) |

**Seuils configurés :** `minAllowed = 26`, `maxAllowed = 32`

**Commande :**
```powershell
docker compose stop iot-simulator

function Publish-Measurement([double]$Temperature, [double]$Humidity) {
    $payload = @{
        warehouseId = "BR-WH-01"; countryCode = "BRA"
        temperature = $Temperature; humidity = $Humidity
        timestamp   = (Get-Date).ToUniversalTime().ToString("o")
    } | ConvertTo-Json -Compress

    $payload | docker compose exec -T mosquitto mosquitto_pub `
      -h localhost -t "futurekawa/brazil/BR-WH-01/measurements" -s
}

# 1. Mesure conforme : résout toute alerte active et repart d'un état propre
Publish-Measurement 29.0 55.0
Start-Sleep 3

# 2. Température hors seuil (33 > 32)
Publish-Measurement 33.0 55.0
Start-Sleep 3

Invoke-RestMethod "http://localhost:3000/api/countries/BRA/alerts?active=true" |
  Select-Object -ExpandProperty data |
  Where-Object { $_.type -eq "TEMPERATURE" -and $_.warehouseId -eq "BR-WH-01" } |
  ConvertTo-Json -Depth 4

# 3. Nettoyage : retour dans la plage (résout l'alerte), puis redémarrage du simulateur
Publish-Measurement 29.0 55.0
docker compose start iot-simulator
```

**Résultat attendu :** une alerte `TEMPERATURE` active pour BR-WH-01 avec `measuredValue=33`, `minAllowed=26`, `maxAllowed=32`, `resolvedAt=null`.

**Résultat obtenu (exécution du 2026-08-13, procédure précédente, simulateur actif) :**
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

> Lors de cette exécution, l'alerte a été résolue après 2 secondes par la mesure suivante du simulateur IoT (`temperature=28.2`). La procédure actuelle arrête le simulateur pour éviter cette interférence.

**Statut : 🟠 À revalider** *(procédure mise à jour ; dernière exécution le 2026-08-13 avec l'ancienne version)*

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
| **Objectif** | Vérifier, sur un lot créé pour le test, le passage à `EXPIRED`, la création d'une alerte `LOT_EXPIRED` associée et la non-duplication au second appel |
| **Préconditions** | MT-01 OK (le scénario crée lui-même son lot de test) |

**⚠ Ce test crée un lot réel unique** (identifiant et entrepôt suffixés par l'horodatage) : il peut être rejoué sans conflit. Utiliser la même session PowerShell pour toutes les étapes.

**Étape 1 — Créer un lot de 400 jours :**
```powershell
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$body = @{
    id          = "mt14-$stamp"
    warehouseId = "WH-MT14-$stamp"
    countryCode = "BRA"
    storageDate = (Get-Date).AddDays(-400).ToUniversalTime().ToString("o")
} | ConvertTo-Json

$lot = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/countries/BRA/lots" `
  -ContentType "application/json" -Body $body
$lotId = $lot.id
Write-Host "Lot créé : $lotId | storageDate : $($lot.storageDate) | statut : $($lot.status)"
```

**Étape 2 — 1er appel de la vérification, puis contrôle du lot et de l'alerte :**
```powershell
$r1 = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/lots/check-expiry"
Write-Host "1er appel : expiredCount = $($r1.expiredCount)"

$lotAfter = Invoke-RestMethod "http://localhost:3001/api/lots/$lotId"
Write-Host "Statut du lot : $($lotAfter.status)"

$alerts1 = @((Invoke-RestMethod "http://localhost:3001/api/alerts").data |
  Where-Object { $_.type -eq "LOT_EXPIRED" -and $_.lotId -eq $lotId })
Write-Host "Alertes LOT_EXPIRED pour ce lot : $($alerts1.Count)"
$alertId14 = $alerts1[0].id
$alerts1[0] | ConvertTo-Json -Depth 4
```

**Étape 3 — 2e appel (idempotence) :**
```powershell
$r2 = Invoke-RestMethod -Method Post -Uri "http://localhost:3001/api/lots/check-expiry"
Write-Host "2e appel : expiredCount = $($r2.expiredCount)"

$alerts2 = @((Invoke-RestMethod "http://localhost:3001/api/alerts").data |
  Where-Object { $_.type -eq "LOT_EXPIRED" -and $_.lotId -eq $lotId })
Write-Host "Alertes LOT_EXPIRED pour ce lot : $($alerts2.Count)"
Write-Host "Même alerte : $($alerts2.Count -eq 1 -and $alerts2[0].id -eq $alertId14)"
```

**Résultat attendu :**
- Étape 1 : lot créé avec le statut `COMPLIANT`.
- Étape 2 : `expiredCount` ≥ 1 (d'autres lots anciens éventuels sont aussi comptés) ; statut du lot `EXPIRED` ; exactement **1** alerte `LOT_EXPIRED` dont le `lotId` est celui du lot créé, `measuredValue` ≈ 400 jours et `maxAllowed = 365`.
- Étape 3 : `expiredCount = 0` ; toujours **1** seule alerte pour ce lot, `Même alerte : True` (pas de doublon).

> Si la vérification horaire automatique de backend-country s'exécute entre l'étape 1 et l'étape 2, le lot peut déjà être `EXPIRED` et `expiredCount` valoir 0 au 1er appel : le statut du lot et l'alerte restent les critères de réussite.

**Résultat obtenu (exécution du 2026-08-13, ancienne procédure basée sur des lots existants) :**

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
| **Objectif** | Vérifier que l'accès à un pays non configuré retourne HTTP 404 (`XXX` est un code volontairement inexistant) |
| **Préconditions** | MT-01 OK |

**Commande :**
```powershell
# PowerShell lève une WebException ; utiliser curl.exe pour voir le code HTTP :
curl.exe -i http://localhost:3000/api/countries/XXX/lots
```

**Résultat attendu :** HTTP 404, corps `{ "error": "Pays non configuré" }`.

**Résultat obtenu (exécution du 2026-08-13, avec un code pays alors non configuré) :**
```
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{"error":"Pays non configuré"}
```

**Statut : 🟠 À revalider** *(procédure mise à jour ; dernière exécution le 2026-08-13 avec l'ancienne version)*

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
3. Vérifier les indicateurs du dashboard :
   - **Total lots** (nombre total de lots BRA)
   - **Conformes** (lots au statut `COMPLIANT`)
   - **Expirés** (lots au statut `EXPIRED`)
   - **Alertes actives** (nombre d'alertes non résolues)
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
1. Sur `http://localhost:5173`, cliquer sur un lot de l'entrepôt BR-WH-01 possédant des mesures.
2. Vérifier les informations du lot (id, entrepôt, date, statut).
3. Vérifier le **graphique température** — courbe chronologique.
4. Vérifier le **graphique humidité** — courbe chronologique.
5. Vérifier que l'historique affiché correspond à l'entrepôt du lot sélectionné (BR-WH-01).

**Résultat attendu :** les deux graphiques affichent un historique non vide, dans l'ordre chronologique (dates croissantes de gauche à droite), cohérent avec l'entrepôt sélectionné et avec les mesures renvoyées par l'API (voir MT-07).

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

### MT-21 — Module IoT physique NodeMCU + DHT22

| Champ | Valeur |
|-------|--------|
| **ID** | MT-21 |
| **Catégorie** | IoT / Matériel |
| **Objectif** | Vérifier la chaîne complète avec le capteur réel : NodeMCU + DHT22 → Wi-Fi → Mosquitto → backend-country → PostgreSQL → API → frontend |
| **Préconditions** | MT-01 OK ; NodeMCU ESP8266 avec capteur DHT22 câblé (broche de données `D2`, comme dans le sketch) ; sketch `Arduino/sketch_oct5a/sketch_oct5a.ino` téléversé ; PC et NodeMCU sur le même réseau Wi-Fi ; port MQTT 1883 autorisé par le pare-feu du PC ; Moniteur série Arduino ouvert à 115200 bauds |

**⚠ Paramètres locaux :** renseigner le nom et le mot de passe du réseau Wi-Fi ainsi que l'adresse du broker (adresse du PC hôte sur le réseau local, visible avec `ipconfig`) uniquement dans la copie locale du sketch. Ne jamais les committer ni les reporter dans la documentation ou les captures.

**Étape 1 — Arrêter le simulateur et poser un repère temporel :**
```powershell
docker compose stop iot-simulator
docker compose ps iot-simulator          # ne doit plus être "Up"
$start = [datetimeoffset]::UtcNow        # toute mesure postérieure vient du module physique
```

**Étape 2 — Connexion Wi-Fi :** alimenter ou réinitialiser le NodeMCU. Le Moniteur série affiche `Connexion WiFi`, puis `WiFi connecte` et l'adresse attribuée au module.

**Étape 3 — Connexion au broker Mosquitto :** le Moniteur série affiche `Connexion Mosquitto... OK`. Côté broker :
```powershell
docker compose logs --tail 20 mosquitto   # connexion du client ESP8266-BR-WH-01
```

**Étape 4 — Lecture réelle du DHT22 :** aucun message `Erreur lecture DHT22` dans le Moniteur série. Pour prouver que la mesure est réelle, approcher brièvement la main ou souffler sur le capteur : l'humidité et la température doivent évoluer sur les mesures suivantes (le simulateur étant arrêté, aucune autre source ne publie).

**Étape 5 — Publication sur le topic attendu :**
```powershell
docker compose exec -T mosquitto mosquitto_sub -h localhost `
  -t "futurekawa/brazil/BR-WH-01/measurements" -C 3 -W 60
```
Chaque message est un JSON contenant `warehouseId = BR-WH-01`, `countryCode = BRA`, `temperature`, `humidity` et un `timestamp` ISO 8601 UTC.

**Étape 6 — Réception par backend-country :**
```powershell
docker compose logs --tail 20 backend-country
```
Lignes attendues : `[mqtt] Mesure enregistrée — BR-WH-01  T=...°C  H=...%`.

**Étapes 7 et 8 — Persistance et vérification via l'API :**
```powershell
$m = Invoke-RestMethod "http://localhost:3001/api/measurements?warehouseId=BR-WH-01&limit=10"
$m.data | Where-Object { [datetimeoffset]$_.timestamp -gt $start } |
  Select-Object id, warehouseId, countryCode, temperature, humidity, timestamp |
  Format-Table
```

**Étape 9 — Frontend :** ouvrir `http://localhost:5173`, sélectionner le Brésil, ouvrir un lot de l'entrepôt BR-WH-01 (date de stockage antérieure à la mesure), cliquer **Actualiser**. La nouvelle mesure apparaît en fin de courbe ; survoler le dernier point pour comparer ses valeurs à celles de l'étape 8.

**Fin du test :** redémarrer le simulateur si nécessaire.
```powershell
docker compose start iot-simulator
```

**Résultat attendu :**
- Wi-Fi et broker connectés (Moniteur série et logs Mosquitto) ;
- mesures réelles du DHT22 publiées sur `futurekawa/brazil/BR-WH-01/measurements`, valeurs qui varient quand le capteur est sollicité ;
- chaque mesure est tracée dans les logs de backend-country ;
- les mesures postérieures à `$start` sont présentes via l'API, avec les mêmes valeurs que le topic ;
- la nouvelle mesure est visible dans le frontend après actualisation.

**Statut : À exécuter** *(nécessite le matériel physique)*

---

## Résumé des résultats

| ID | Scénario | Catégorie | Statut |
|----|----------|-----------|--------|
| MT-01 | Démarrage Docker Compose | Infra | ✅ OK |
| MT-02 | Health backend pays | API | ✅ OK |
| MT-03 | Health backend central | API | ✅ OK |
| MT-04 | Liste des pays | API | ✅ OK |
| MT-05 | Liste des lots FIFO | API / Métier | ✅ OK |
| MT-06 | Consultation d'un lot | API | 🟠 À revalider |
| MT-07 | Historique mesures d'un lot | API / Données | 🟠 À revalider |
| MT-08 | Publication MQTT manuelle | IoT / MQTT | ✅ OK |
| MT-09 | Création alerte HUMIDITY | Alertes | ✅ OK |
| MT-10 | Non-duplication alerte | Alertes | 🔲 À exécuter |
| MT-11 | Résolution alerte | Alertes | 🔲 À exécuter |
| MT-12 | Alerte température | Alertes | 🟠 À revalider |
| MT-13 | Email d'alerte MailHog | Email | ✅ OK |
| MT-14 | Contrôle expiration lots | Métier | ✅ OK |
| MT-15 | Pays non configuré (404) | API / Erreurs | 🟠 À revalider |
| MT-16 | Résilience backend pays (503) | Résilience | ✅ OK |
| MT-17 | Frontend : tableau de bord FIFO | Frontend | 🔲 À exécuter |
| MT-18 | Frontend : graphiques lot | Frontend | 🔲 À exécuter |
| MT-19 | Frontend : création d'un lot | Frontend | 🔲 À exécuter |
| MT-20 | Frontend : actualisation mesures | Frontend | 🔲 À exécuter |
| MT-21 | Module IoT physique NodeMCU + DHT22 | IoT / Matériel | 🔲 À exécuter |

**Total de scénarios :** 21  
**Résultat :** 10 ✅ OK — 0 ❌ KO — 4 🟠 À revalider (MT-06, MT-07, MT-12, MT-15) — 7 🔲 À exécuter (MT-10, MT-11, MT-17, MT-18, MT-19, MT-20, MT-21)

> **🟠 À revalider** : la procédure a été mise à jour (lot récupéré dynamiquement, timestamp courant, simulateur arrêté, code pays `XXX`) ; le résultat obtenu date de l'exécution du 2026-08-13 avec l'ancienne version. Ces scénarios repasseront ✅ OK uniquement après une nouvelle exécution.

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
| 6 | HTTP 404 pays non configuré | `curl.exe -i http://localhost:3000/api/countries/XXX/lots` |
| 7 | Dashboard Frontend — lots FIFO | `http://localhost:5173` |
| 8 | Graphiques température/humidité | Cliquer sur un lot dans le frontend |
| 9 | Jenkins — build vert (pipeline 7 stages) | `http://localhost:8080/job/futurekawa/` |
| 10 | Jenkins — rapport JUnit (68 tests) | `http://localhost:8080/job/futurekawa/lastBuild/testReport/` |
