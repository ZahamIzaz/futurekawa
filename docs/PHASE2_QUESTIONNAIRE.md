# FutureKawa — Questionnaire de cadrage Phase 2

**Sujet :** automatisation du chauffage, de l'humidification et de l'aération des entrepôts
**Destinataires :** direction, responsables d'exploitation, équipes Qualité, maintenance et SI
**Statut :** questionnaire préparatoire, aucune réponse client n'est supposée


---

## 1. Objectifs métier

| # | Question | Réponse |
|---|---|---|
| 1.1 | Quels problèmes l'automatisation doit-elle résoudre en priorité (pertes, non-conformités, charge opérateur, autre) ? | |
| 1.2 | Quel est le niveau actuel de pertes ou de lots déclassés liés aux conditions de stockage, et quelle réduction est attendue ? | |
| 1.3 | Quel impact attendu sur la qualité des lots (arômes, humidité du grain, moisissures) ? | |
| 1.4 | Combien de temps les opérateurs consacrent-ils aujourd'hui à la surveillance et aux corrections, et quel gain est visé ? | |
| 1.5 | Existe-t-il des objectifs de consommation énergétique ou de coûts d'exploitation ? | |
| 1.6 | Quels pays et quels entrepôts sont prioritaires, et pourquoi ? | |

## 2. Règles de température et d'humidité

Contexte actuel du prototype (à confirmer ou corriger) :

| Pays | Température cible | Humidité cible | Tolérance |
|---|---|---|---|
| Brésil | 29 °C | 55 % | ±3 °C / ±2 % |
| Équateur | 31 °C | 60 % | ±3 °C / ±2 % |
| Colombie | 26 °C | 80 % | ±3 °C / ±2 % |

| # | Question | Réponse |
|---|---|---|
| 2.1 | Ces seuils sont-ils définitifs ? Qui peut les modifier ? | |
| 2.2 | Varient-ils selon le pays ou l'entrepôt ? | |
| 2.3 | Doivent-ils varier selon le type de café, la saison ou le lot ? | |
| 2.4 | Combien de temps une valeur peut-elle rester hors plage avant intervention ? | |
| 2.5 | Quelle marge ou hystérésis appliquer avant l'activation et avant l'arrêt d'un équipement ? | |
| 2.6 | Des écarts transitoires (ouverture de porte, chargement) doivent-ils être tolérés ? | |

## 3. Niveau d'automatisation

| # | Question | Réponse |
|---|---|---|
| 3.1 | Quelles actions peuvent être totalement automatiques ? | |
| 3.2 | Quelles actions nécessitent une validation humaine préalable ? | |
| 3.3 | Quel comportement attendu en mode manuel (équipements commandés individuellement, automatisme suspendu) ? | |
| 3.4 | Quel comportement attendu en mode automatique ? | |
| 3.5 | Quels rôles ont le droit de passer d'un mode à l'autre ? | |
| 3.6 | Le mode doit-il être défini par entrepôt, par équipement ou globalement ? | |
| 3.7 | Qui peut forcer l'arrêt d'un équipement, et ce forçage prime-t-il sur toute décision automatique ? | |

## 4. Chauffage, humidification et aération

À renseigner pour chacun des trois équipements.

| # | Question | Chauffage | Humidification | Aération |
|---|---|---|---|---|
| 4.1 | Dans quelles situations l'activer ? | | | |
| 4.2 | Dans quelles situations l'arrêter ? | | | |
| 4.3 | Existe-t-il une durée maximale d'utilisation continue ? | | | |
| 4.4 | Un temps de repos minimal entre deux activations est-il nécessaire ? | | | |
| 4.5 | Avec quels équipements est-il incompatible s'ils fonctionnent simultanément ? | | | |

| # | Question | Réponse |
|---|---|---|
| 4.6 | En cas de conflit (ex. température trop basse et humidité trop élevée), quelle action est prioritaire ? | |
| 4.7 | L'aération peut-elle être utilisée pour corriger à la fois une température et une humidité trop élevées ? | |

## 5. Sécurité

| # | Question | Réponse |
|---|---|---|
| 5.1 | Quel comportement attendu en cas de panne ou de perte du capteur ? | |
| 5.2 | Quel comportement attendu en cas de perte du réseau ou du broker MQTT ? | |
| 5.3 | Quel comportement attendu si le backend est indisponible ? | |
| 5.4 | Quel comportement attendu en cas de coupure électrique, et au retour du courant ? | |
| 5.5 | Que faire si un actionneur est bloqué (en marche ou à l'arrêt) ? | |
| 5.6 | Un arrêt d'urgence est-il requis ? Sous quelle forme (bouton physique, interface) ? | |
| 5.7 | Quelles sécurités matérielles indépendantes du logiciel sont exigées (thermostat de sécurité, limiteur de durée, disjoncteur) ? | |
| 5.8 | Quelles règles de redémarrage après incident (reprise automatique, validation humaine, vérification préalable) ? | |
| 5.9 | Quelles normes ou réglementations de sécurité s'appliquent aux installations ? | |

## 6. Matériel et infrastructure

| # | Question | Réponse |
|---|---|---|
| 6.1 | Quels équipements de chauffage, d'humidification et d'aération existent déjà dans chaque entrepôt ? | |
| 6.2 | Peuvent-ils être commandés électriquement ? Sinon, quelles modifications sont envisageables ? | |
| 6.3 | Quelles interfaces ou protocoles sont disponibles (contact sec, relais, Modbus, 0-10 V, autre) ? | |
| 6.4 | Quelles contraintes électriques (tension, puissance, protections, armoires) ? | |
| 6.5 | Quelles contraintes de couverture Wi-Fi ou réseau filaire ? | |
| 6.6 | Quelles contraintes environnementales (poussière, humidité, température, normes d'étanchéité) ? | |
| 6.7 | L'ajout de relais, d'automates ou de contrôleurs industriels est-il acceptable ? | |
| 6.8 | Combien de capteurs par entrepôt, et une redondance est-elle souhaitée ? | |

## 7. Maintenance

| # | Question | Réponse |
|---|---|---|
| 7.1 | Qui maintient les capteurs ? | |
| 7.2 | Qui maintient les actionneurs et le contrôleur ? | |
| 7.3 | Quelle fréquence de contrôle et de calibrage des capteurs ? | |
| 7.4 | Quelle procédure en cas de panne (qui prévenir, délai d'intervention) ? | |
| 7.5 | Des pièces de rechange doivent-elles être stockées sur site ? | |
| 7.6 | Comment fonctionne l'entrepôt lorsque l'automatisation est indisponible ? | |
| 7.7 | Qui effectue les mises à jour logicielles, et à quel moment sont-elles autorisées ? | |

## 8. Alertes et responsabilités

| # | Question | Réponse |
|---|---|---|
| 8.1 | Qui reçoit les alertes, par pays et par entrepôt ? | |
| 8.2 | Quels niveaux de criticité prévoir (information, avertissement, critique) ? | |
| 8.3 | Par quel canal : email, SMS, interface web, autre ? | |
| 8.4 | Quel délai d'intervention attendu pour chaque niveau ? | |
| 8.5 | Qui doit acquitter une alerte, et que se passe-t-il sans acquittement (escalade) ? | |
| 8.6 | Qui est autorisé à forcer une commande manuelle ? | |
| 8.7 | Qui est responsable en cas d'incident lié à une décision automatique ? | |

## 9. Traçabilité et audit

| # | Question | Réponse |
|---|---|---|
| 9.1 | Quelles commandes doivent être historisées (activation, arrêt, forçage) ? | |
| 9.2 | Les changements de mode AUTO/MANUEL doivent-ils être tracés ? | |
| 9.3 | Faut-il enregistrer l'identité de l'utilisateur à l'origine d'une commande ? | |
| 9.4 | Faut-il conserver les mesures ayant provoqué chaque décision automatique ? | |
| 9.5 | Quelle durée de conservation des événements et des mesures ? | |
| 9.6 | Quels rapports sont nécessaires pour les équipes Qualité (format, fréquence) ? | |

## 10. Sécurité informatique

| # | Question | Réponse |
|---|---|---|
| 10.1 | Quelles exigences d'authentification des utilisateurs (SSO, MFA, mot de passe) ? | |
| 10.2 | Quels rôles et droits (consultation, commande manuelle, changement de mode, configuration des seuils) ? | |
| 10.3 | Comment authentifier les équipements IoT auprès du broker ? | |
| 10.4 | Le chiffrement MQTT/TLS est-il exigé ? | |
| 10.5 | Quelles contraintes pour les accès distants (VPN, filtrage, accès depuis l'extérieur) ? | |
| 10.6 | Quelles actions sensibles doivent être journalisées ? | |
| 10.7 | Des politiques de sécurité du groupe s'imposent-elles (cloud, hébergement, données) ? | |

## 11. Coûts et déploiement

| # | Question | Réponse |
|---|---|---|
| 11.1 | Quel budget est prévu (investissement et exploitation) ? | |
| 11.2 | Quel pays et quel entrepôt serviront de pilote ? | |
| 11.3 | Déploiement progressif ou global ? | |
| 11.4 | Quelles contraintes de calendrier (saisonnalité, périodes de forte activité) ? | |
| 11.5 | Quelles ressources sont disponibles (équipes locales, prestataires, électriciens) ? | |
| 11.6 | Quels critères permettent de passer du pilote à la production ? | |
| 11.7 | Quel retour sur investissement est attendu et à quel horizon ? | |

## 12. Indicateurs de réussite

Pour chaque indicateur : est-il retenu, comment le mesure-t-on, et quelle valeur cible ?

| # | Indicateur | Retenu ? | Valeur de référence actuelle | Cible |
|---|---|---|---|---|
| 12.1 | Temps passé hors plage | | | |
| 12.2 | Nombre d'alertes | | | |
| 12.3 | Temps moyen de retour à une situation normale | | | |
| 12.4 | Nombre de lots déclassés ou perdus | | | |
| 12.5 | Disponibilité du système | | | |
| 12.6 | Nombre d'interventions manuelles | | | |
| 12.7 | Consommation énergétique | | | |
| 12.8 | Autres indicateurs souhaités | | | |

## 13. Scénarios d'incident

Pour chaque scénario : quel comportement attendu des équipements, qui est alerté, et quelle procédure de reprise ?

| # | Scénario | Comportement attendu | Alerte / responsable | Reprise |
|---|---|---|---|---|
| 13.1 | Capteur muet (plus aucune mesure) | | | |
| 13.2 | Valeur aberrante (ex. température impossible) | | | |
| 13.3 | Perte du broker MQTT | | | |
| 13.4 | Panne du backend | | | |
| 13.5 | Coupure électrique | | | |
| 13.6 | Actionneur sans effet (commandé mais aucun changement mesuré) | | | |
| 13.7 | Actionneur bloqué en marche | | | |
| 13.8 | Conditions qui continuent à se dégrader malgré l'action automatique | | | |
| 13.9 | Conflit entre commande manuelle et décision automatique | | | |

Questions complémentaires :

| # | Question | Réponse |
|---|---|---|
| 13.10 | Au bout de combien de temps sans amélioration faut-il considérer qu'une action automatique est inefficace ? | |
| 13.11 | Des exercices de simulation d'incident doivent-ils être prévus avant la mise en production ? | |

## 14. Priorisation

Le client classe chaque fonctionnalité : **P** = indispensable pour le pilote, **S** = souhaitable, **U** = phase ultérieure.

| Fonctionnalité | P | S | U | Commentaire |
|---|---|---|---|---|
| Commande automatique du chauffage | | | | |
| Commande automatique de l'humidification | | | | |
| Commande automatique de l'aération | | | | |
| Mode manuel avec commande individuelle des équipements | | | | |
| Bascule AUTO/MANUEL depuis l'interface web | | | | |
| Hystérésis et durée maximale d'activation | | | | |
| Mise en sécurité automatique (fail-safe) | | | | |
| Arrêt d'urgence | | | | |
| Retour d'état des actionneurs | | | | |
| Alertes email | | | | |
| Alertes SMS ou autre canal | | | | |
| Acquittement des alertes | | | | |
| Historique des commandes et changements de mode | | | | |
| Gestion des rôles et authentification | | | | |
| Chiffrement MQTT/TLS et authentification des équipements | | | | |
| Seuils variables (type de café, saison, lot) | | | | |
| Tableau de bord des indicateurs (KPI) | | | | |
| Rapports pour l'équipe Qualité | | | | |
| Suivi de la consommation énergétique | | | | |
| Extension à l'Équateur et à la Colombie | | | | |
| Redondance des capteurs | | | | |

---

## Suites à donner

- Compléter ce questionnaire pendant l'interview et le faire valider par le client.
- Mettre à jour [PHASE2_AUTOMATION.md](PHASE2_AUTOMATION.md) avec les exigences confirmées.
- Lancer une phase de cadrage métier et sécurité avant toute implémentation.
