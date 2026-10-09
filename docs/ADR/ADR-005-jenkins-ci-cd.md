# ADR-005 — Jenkins pour l'intégration continue

- **Statut :** Accepted
- **Date :** 2026-10-09

## Contexte

Le projet doit démontrer une intégration continue reproductible : compilation, tests automatisés, vérification qualité, packaging et production d'artefacts exploitables pour la démonstration.

## Décision

Utiliser un `Jenkinsfile` déclaratif versionné avec le dépôt. Le pipeline exécute les étapes principales suivantes : checkout, installation, build, tests, publication des rapports JUnit, construction des images Docker et archivage des artefacts.

## Alternatives envisagées

1. Lancer manuellement les builds et les tests avant livraison.
2. Utiliser uniquement une CI hébergée externe.
3. Utiliser Jenkins conteneurisé avec pipeline versionné dans le dépôt.

## Raisons du choix

- Jenkins est explicitement demandé par le cahier des charges ;
- le pipeline fait partie du code source et évolue avec le projet ;
- les trois paquets peuvent être construits et testés de manière automatisée ;
- les rapports JUnit fournissent une preuve exploitable dans Jenkins ;
- les images Docker produites relient une livraison à une révision Git.

## Conséquences

### Positives

- build reproductible ;
- échec bloquant si compilation ou tests échouent ;
- publication automatique des résultats de tests ;
- traçabilité entre commit, build Jenkins et images Docker.

### Négatives / compromis

- le Jenkins de démonstration monte le socket Docker de l'hôte, ce qui ne convient pas à une production ;
- les tests Playwright end-to-end restent exécutés séparément de la CI principale ;
- une industrialisation devra durcir l'agent Jenkins et la gestion des secrets.

## Qualité associée

La compilation TypeScript en mode strict et les rapports JUnit constituent les contrôles de qualité intégrés au pipeline. Des outils complémentaires de lint ou d'analyse statique peuvent être ajoutés ultérieurement sans modifier l'architecture du pipeline.
