# FutureKawa - MSPR Bloc 4

## Objectif

Développer un prototype avancé permettant à FutureKawa de gérer les lots
de café et de surveiller les conditions de stockage.

## Architecture cible

Frontend React
        |
Backend central siège
        |
Backend pays (Brésil)
        |
PostgreSQL

IoT simulator / ESP32
        |
MQTT Mosquitto
        |
Backend pays

## Stack retenue

- TypeScript
- Node.js
- Express
- React + Vite
- PostgreSQL
- Prisma
- Mosquitto MQTT
- Docker / Docker Compose
- Vitest
- Jenkins

## Fonctionnalités principales

1. Gestion des lots
2. Tri FIFO
3. Mesures température/humidité
4. MQTT
5. Historique des mesures
6. Alertes température/humidité
7. Alerte lot > 365 jours
8. Notification email
9. Backend central
10. Dashboard Web
11. Tests
12. CI Jenkins

## Pays

Brésil :
- température cible : 29°C
- tolérance : ±3°C
- humidité cible : 55%
- tolérance : ±2%

Équateur :
- température : 31°C
- humidité : 60%

Colombie :
- température : 26°C
- humidité : 80%

## Règles de développement

- privilégier une architecture simple
- éviter la sur-ingénierie
- code TypeScript strict
- documenter les endpoints
- écrire les tests progressivement
- tout doit pouvoir être lancé localement
- Docker Compose doit être la méthode principale de lancement
- ne pas implémenter une fonctionnalité qui n'est pas nécessaire au cahier des charges