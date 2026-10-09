# ADR-002 — MQTT pour la remontée IoT

- **Statut :** Accepted
- **Date :** 2026-10-09

## Contexte

Le module IoT doit publier régulièrement des mesures de température et d'humidité depuis un microcontrôleur disposant de ressources limitées et pouvant évoluer sur un réseau de terrain instable.

## Décision

Utiliser MQTT avec Mosquitto comme broker local au pays. Le module physique et le simulateur publient le même format JSON sur une convention de topic contenant le pays et l'entrepôt :

`futurekawa/<pays>/<warehouseId>/measurements`

## Alternatives envisagées

1. Appels HTTP directs du microcontrôleur vers le backend.
2. WebSocket permanent entre capteur et serveur.
3. MQTT publish/subscribe avec broker local.

## Raisons du choix

- protocole léger adapté aux équipements IoT ;
- découplage entre producteur de mesures et backend consommateur ;
- possibilité de reconnecter le capteur sans modifier l'API métier ;
- possibilité d'utiliser un simulateur logiciel sans changer le backend ;
- broker local cohérent avec l'autonomie du pays.

## Conséquences

### Positives

- faible charge côté microcontrôleur ;
- ingestion asynchrone ;
- capteur physique et simulateur interchangeables pour la recette ;
- ajout de nouveaux producteurs sans modifier l'interface centrale.

### Négatives / compromis

- le broker devient un composant d'infrastructure à superviser ;
- en POC, le broker fonctionne sur le réseau local sans TLS ni authentification ;
- une industrialisation devra ajouter authentification, chiffrement et droits par topic.

## Décision appliquée dans le POC

Un NodeMCU ESP8266 associé à un DHT22 publie les mesures du dépôt `BR-WH-01`. Le backend pays consomme le topic, persiste les mesures et déclenche les règles d'alerte.
