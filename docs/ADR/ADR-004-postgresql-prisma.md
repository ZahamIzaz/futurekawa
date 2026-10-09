# ADR-004 — PostgreSQL et Prisma pour la persistance

- **Statut :** Accepted
- **Date :** 2026-10-09

## Contexte

FutureKawa doit conserver des lots, des mesures horodatées et des alertes avec des règles d'intégrité, des tris FIFO et des consultations historiques. Le cahier des charges impose une base SQL.

## Décision

Utiliser PostgreSQL comme base relationnelle et Prisma comme couche d'accès aux données, avec schéma et migrations versionnés.

## Alternatives envisagées

1. Base NoSQL orientée documents.
2. SQL avec requêtes écrites directement dans le code.
3. PostgreSQL avec ORM et migrations Prisma.

## Raisons du choix

- conformité à l'exigence SQL ;
- modèle relationnel adapté aux lots, mesures et alertes ;
- tris temporels et FIFO simples à exprimer ;
- migrations reproductibles ;
- client typé généré à partir du schéma ;
- cohérence avec TypeScript sur les backends.

## Conséquences

### Positives

- schéma versionné avec le code ;
- contraintes et index centralisés ;
- meilleure maintenabilité des accès aux données ;
- démarrage reproductible sur une base vierge via les migrations.

### Négatives / compromis

- dépendance à Prisma et à son client généré ;
- le POC ne met pas encore en place de stratégie de sauvegarde ou réplication ;
- l'historique volumineux devra être paginé ou agrégé dans une industrialisation.
