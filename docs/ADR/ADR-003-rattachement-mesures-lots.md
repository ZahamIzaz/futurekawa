# ADR-003 — Rattachement des mesures aux lots par entrepôt et fenêtre temporelle

- **Statut :** Accepted
- **Date :** 2026-10-09

## Contexte

Le capteur mesure les conditions d'un entrepôt alors que plusieurs lots peuvent y être stockés simultanément. Les courbes d'un lot doivent représenter les mesures observées depuis sa date d'entrée en stockage.

## Décision

Ne pas stocker de clé étrangère `lotId` dans chaque mesure IoT. Le rattachement d'un lot à ses mesures est calculé avec deux critères :

1. `Measurement.warehouseId == Lot.warehouseId`
2. `Measurement.timestamp >= Lot.storageDate`

## Alternatives envisagées

1. Ajouter `lotId` dans chaque message MQTT.
2. Créer une table d'association explicite entre chaque mesure et chaque lot.
3. Associer les mesures à l'entrepôt et filtrer par fenêtre temporelle lors de la consultation.

## Raisons du choix

- un capteur observe un entrepôt, pas un lot particulier ;
- plusieurs lots partagent les mêmes conditions de stockage ;
- éviter de reconfigurer le microcontrôleur à chaque entrée ou sortie de lot ;
- correspondre au besoin métier : afficher les courbes d'un lot depuis son stockage.

## Conséquences

### Positives

- faible couplage entre IoT et gestion des stocks ;
- pas de duplication de mesures entre lots partageant un entrepôt ;
- ajout et retrait de lots sans impact sur le firmware du capteur.

### Négatives / compromis

- l'historique d'un lot dépend de la qualité du `warehouseId` et de l'horodatage ;
- sans date de sortie du lot, les mesures continuent d'être associées tant que le lot reste dans le modèle ;
- plusieurs lots d'un même entrepôt voient la même série de mesures sur leurs périodes respectives.

## Évolution possible

Ajouter une date de sortie ou un état de présence en entrepôt si le métier exige de borner précisément la période de rattachement.
