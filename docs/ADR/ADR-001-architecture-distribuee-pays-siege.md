# ADR-001 — Architecture distribuée pays ↔ siège

- **Statut :** Accepted
- **Date :** 2026-10-09

## Contexte

FutureKawa doit superviser plusieurs pays tout en conservant une autonomie locale des entrepôts. La collecte IoT, la persistance des mesures et les alertes ne doivent pas dépendre de la disponibilité du siège.

## Décision

Chaque pays dispose de son propre backend local, de sa base SQL et de son broker MQTT. Le siège dispose d'un backend central qui interroge les backends pays via des API REST. Le frontend ne dialogue qu'avec le backend central et n'accède jamais directement aux bases pays.

## Alternatives envisagées

1. Base de données centrale unique pour tous les pays.
2. Réplication ou remontée systématique des données pays vers une base centrale.
3. Architecture distribuée avec autonomie locale et interrogation par API.

## Raisons du choix

- conserver la collecte et l'alerting localement en cas de coupure avec le siège ;
- isoler les pannes par pays ;
- éviter un accès direct du siège aux bases locales ;
- permettre l'ajout d'un pays par configuration et déploiement d'une nouvelle instance ;
- respecter le cahier des charges qui prévoit un backend local par pays et un backend central de consolidation.

## Conséquences

### Positives

- autonomie des pays ;
- meilleure isolation des pannes ;
- faible couplage entre frontend et topologie des pays ;
- architecture extensible à l'Équateur et à la Colombie.

### Négatives / compromis

- la consultation centrale dépend de la disponibilité du backend pays concerné ;
- ajout d'une configuration et d'une instance supplémentaires pour chaque nouveau pays ;
- pas de copie centrale garantissant une consultation hors ligne des données pays.

## Décision appliquée dans le POC

Le Brésil est l'instance pays effectivement déployée. Le backend central expose des routes génériques par `countryCode`, et le frontend découvre les pays via l'API centrale.
