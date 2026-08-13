# Guide Utilisateur — FutureKawa

**Supervision des stocks et conditions de stockage**

---

## 1. Objectif

FutureKawa permet aux responsables de superviser les lots de café stockés dans les entrepôts des pays producteurs.

Depuis le tableau de bord, vous pouvez :

- consulter les lots dans l'ordre de priorité FIFO (le plus ancien en premier) ;
- visualiser l'évolution de la température et de l'humidité de chaque lot ;
- suivre les alertes en temps réel ;
- créer un nouveau lot.

**Prototype actuel :** le Brésil est le pays pilote implémenté, avec l'entrepôt `BR-WH-01`.

---

## 2. Accéder à l'application

Ouvrez votre navigateur et saisissez :

```
http://localhost:5173
```

> **Prérequis :** l'environnement Docker doit avoir été démarré au préalable par l'administrateur technique. Si la page n'est pas accessible, contactez l'équipe technique.

---

## 3. Présentation du tableau de bord

[Capture à insérer — Tableau de bord FutureKawa]

L'interface est organisée de haut en bas :

| Zone | Contenu |
|------|---------|
| En-tête | Titre **FutureKawa** — *Supervision des stocks et conditions de stockage* |
| Barre d'outils | Sélecteur de pays (**Pays :**) + bouton **↻ Actualiser** |
| Cartes de synthèse | 4 indicateurs clés (voir ci-dessous) |
| Section **Lots – ordre FIFO** | Tableau de tous les lots + bouton **+ Ajouter un lot** |
| Section **Lot sélectionné** | Détail du lot sur lequel vous avez cliqué *(s'affiche après sélection)* |
| Section **Historique température / humidité** | Graphiques des mesures *(s'affiche après sélection d'un lot)* |
| Section **Alertes actives** | Liste des incidents en cours |

### Cartes de synthèse

| Carte | Couleur | Signification |
|-------|---------|---------------|
| **Lots** | Neutre | Nombre total de lots enregistrés pour le pays |
| **Conformes** | Vert | Lots dont les conditions de stockage sont normales |
| **Expirés** | Rouge | Lots stockés depuis plus de 365 jours |
| **Alertes actives** | Orange | Incidents non résolus (température, humidité, expiration) |

---

## 4. Sélectionner un pays

Dans la barre d'outils, le sélecteur **Pays :** vous permet de choisir le pays producteur à superviser.

Dans le prototype actuel, le pays disponible est :

| Code | Nom |
|------|-----|
| BRA | Brésil |

> L'architecture de FutureKawa est prévue pour accueillir d'autres pays producteurs. Seul le Brésil est disponible dans cette version.

Dès que vous changez de pays, les lots et les alertes sont rechargés automatiquement.

---

## 5. Consulter les lots

[Capture à insérer — Tableau FIFO]

La section **Lots – ordre FIFO** liste tous les lots enregistrés sous forme de tableau.

### Colonnes du tableau

| Colonne | Contenu |
|---------|---------|
| **Identifiant** | Code unique du lot (généré automatiquement) |
| **Entrepôt** | Identifiant de l'entrepôt où le lot est stocké (ex. `BR-WH-01`) |
| **Date de stockage** | Date à laquelle le lot a été placé en stockage |
| **Statut** | État actuel du lot (voir section 7) |

Si aucun lot n'est enregistré, le message *Aucun lot disponible.* est affiché.

**Pour sélectionner un lot**, cliquez sur la ligne souhaitée. La ligne est mise en surbrillance et les sections **Lot sélectionné** et **Historique température / humidité** s'affichent en dessous.

---

## 6. Comprendre le principe FIFO

**FIFO** signifie *First In, First Out* — premier entré, premier sorti.

Le lot dont la date de stockage est la plus ancienne apparaît **en premier** dans le tableau. C'est lui qui doit être traité ou expédié en priorité.

### Exemple

| Lot | Date de stockage |
|-----|-----------------|
| Lot A | 01/01/2026 |
| Lot B | 01/06/2026 |
| Lot C | 01/08/2026 |

FutureKawa les affiche dans cet ordre :

1. **Lot A** — priorité maximale (le plus ancien)
2. **Lot B**
3. **Lot C** — le plus récent

> FutureKawa utilise la **date de stockage** que vous avez saisie à la création du lot, et non la date d'enregistrement informatique.

---

## 7. Comprendre les statuts

Chaque lot est affiché avec un badge de statut coloré.

| Statut | Couleur | Signification | Action recommandée |
|--------|---------|---------------|--------------------|
| **Conforme** | Vert | Conditions de stockage normales | Aucune action particulière |
| **Alerte** | Orange | Un incident de température ou d'humidité est actif | Consulter la section Alertes actives |
| **Expiré** | Rouge | Lot stocké depuis plus de 365 jours | Prioriser son traitement, alerter le responsable |

---

## 8. Consulter le détail d'un lot

Cliquez sur une ligne du tableau. La section **Lot sélectionné** apparaît immédiatement en dessous.

### Informations affichées

| Champ | Contenu |
|-------|---------|
| **Identifiant** | Code unique du lot |
| **Entrepôt** | Identifiant de l'entrepôt |
| **Pays** | Code pays (ex. `BRA`) |
| **Date de stockage** | Date d'entrée en stockage (format jj/mm/aaaa) |
| **Statut** | Badge coloré : Conforme, Alerte ou Expiré |

---

## 9. Consulter les courbes température / humidité

[Capture à insérer — Graphiques température / humidité]

Après avoir sélectionné un lot, la section **Historique température / humidité** s'affiche avec deux graphiques.

### Graphique Température (°C)

- **Axe horizontal** : date et heure de la mesure
- **Axe vertical** : température en degrés Celsius (°C)
- **Couleur** : rouge

### Graphique Humidité (%)

- **Axe horizontal** : date et heure de la mesure
- **Axe vertical** : humidité relative en % (pourcentage)
- **Couleur** : bleu

Les données affichées correspondent aux mesures reçues depuis la **date de stockage du lot** dans son entrepôt. Si aucune mesure n'est disponible, le message *Aucune mesure disponible pour ce lot.* est affiché.

> Les données sont mises à jour automatiquement toutes les 10 secondes.

---

## 10. Valeurs normales pour le Brésil

| Paramètre | Valeur cible | Plage acceptable |
|-----------|-------------|-----------------|
| Température | 29 °C | 26 °C à 32 °C |
| Humidité | 55 % | 53 % à 57 % |

Toute mesure **en dehors de ces plages** génère automatiquement une alerte.

---

## 11. Consulter les alertes

[Capture à insérer — Alertes actives]

La section **Alertes actives** liste les incidents en cours.

Si aucune alerte n'est active, le message *Aucune alerte active.* est affiché.

### Types d'alertes

| Type | Couleur du badge | Signification |
|------|-----------------|---------------|
| **Température** | Rouge | La température est sortie de la plage 26–32 °C |
| **Humidité** | Bleu | L'humidité est sortie de la plage 53–57 % |
| **Lot expiré** | Orange | Un lot est stocké depuis plus de 365 jours |

### Informations affichées par alerte

| Information | Description |
|-------------|-------------|
| Badge de type | Température / Humidité / Lot expiré |
| **Entrepôt** | Identifiant de l'entrepôt concerné |
| Date de création | Date et heure du déclenchement |
| Message | Description de l'anomalie |
| **Valeur mesurée** | Valeur qui a déclenché l'alerte *(température et humidité uniquement)* |
| **Plage autorisée** | Plage min–max *(température et humidité uniquement)* |
| Jours stockés / Identifiant du lot | *(lot expiré uniquement)* |

> Il n'y a pas de bouton « Résoudre » : les alertes de température et d'humidité se ferment automatiquement lorsque la valeur revient dans la plage normale (voir section 13).

---

## 12. Que faire en cas d'alerte ?

### Alerte Température

1. Dans la section **Alertes actives**, identifier l'entrepôt concerné.
2. Relever la valeur mesurée et la comparer à la plage 26–32 °C.
3. Contrôler le système de climatisation ou de régulation thermique de l'entrepôt.
4. Surveiller le graphique **Température (°C)** pour suivre l'évolution.
5. L'alerte disparaît automatiquement dès que la température revient dans la plage.

### Alerte Humidité

1. Dans la section **Alertes actives**, identifier l'entrepôt concerné.
2. Relever la valeur mesurée et la comparer à la plage 53–57 %.
3. Contrôler les conditions d'hygrométrie de l'entrepôt.
4. Surveiller le graphique **Humidité (%)** pour suivre l'évolution.
5. L'alerte disparaît automatiquement dès que l'humidité revient dans la plage.

### Alerte Lot expiré

1. Dans la section **Alertes actives**, identifier le lot concerné (identifiant affiché).
2. Retrouver le lot dans le tableau **Lots – ordre FIFO**.
3. Vérifier sa **date de stockage** : elle indique depuis combien de temps le lot est en entrepôt.
4. Donner la priorité au traitement ou à l'expédition de ce lot.
5. Prendre une décision avec le responsable métier sur la suite à donner.

---

## 13. Résolution automatique des alertes

Pour les alertes de **Température** et d'**Humidité** :

- Une alerte s'ouvre automatiquement quand la mesure sort de la plage acceptable.
- Quand la valeur revient dans la plage normale, l'alerte **disparaît automatiquement** de la liste des alertes actives.
- **Aucune action de votre part n'est nécessaire** pour fermer ces alertes.

Pour les alertes **Lot expiré** :

- Elles restent visibles dans la liste jusqu'à ce que le lot soit traité.

> Note technique : les alertes résolues sont conservées en base de données à des fins de traçabilité, mais elles ne sont plus affichées dans la section **Alertes actives**.

---

## 14. Créer un lot

[Capture à insérer — Formulaire de création de lot]

Dans la section **Lots – ordre FIFO**, cliquez sur le bouton **+ Ajouter un lot**.

Un formulaire apparaît dans une fenêtre modale.

### Champs du formulaire

| Champ | Type | Description |
|-------|------|-------------|
| **Pays** | Lecture seule | Pays actuellement sélectionné (ex. : Brésil) — non modifiable |
| **Entrepôt** | Texte | Identifiant de l'entrepôt (valeur par défaut : `BR-WH-01`) |
| **Date de stockage** | Date | Date d'entrée du lot en stockage |

> Dans le prototype actuel, l'entrepôt pilote est `BR-WH-01`. Conservez cette valeur par défaut sauf instruction contraire.

### Étapes

1. Vérifiez ou saisissez l'identifiant de l'entrepôt.
2. Sélectionnez la **date de stockage** du lot (date réelle d'entrée en entrepôt).
3. Cliquez sur **Créer le lot**.
4. Le bouton affiche *Création…* pendant l'enregistrement.
5. Après confirmation, le message *Lot créé avec succès.* s'affiche brièvement.
6. Le nouveau lot apparaît dans le tableau, positionné selon sa date de stockage (ordre FIFO).

Pour annuler sans créer de lot, cliquez sur **Annuler** ou en dehors de la fenêtre.

---

## 15. Actualiser les données

Les données se rafraîchissent **automatiquement toutes les 10 secondes** : lots, alertes et graphiques sont mis à jour en arrière-plan sans que vous ayez à intervenir.

Vous pouvez également forcer une actualisation immédiate en cliquant sur le bouton **↻ Actualiser** dans la barre d'outils.

L'actualisation recharge :

- les lots du pays sélectionné ;
- les alertes actives ;
- les mesures du lot sélectionné (si un lot est actif).

---

## 16. Notifications email

Lorsqu'une nouvelle alerte est créée (température hors plage, humidité hors plage, lot expiré), le **responsable du pays** reçoit automatiquement une notification par email.

Dans le prototype :

- Responsable Brésil : `responsable.bresil@futurekawa.local`

> Note : dans l'environnement de démonstration MSPR, les emails sont capturés par un outil de test interne et ne sont pas envoyés sur Internet. L'administrateur technique peut les consulter à l'adresse `http://localhost:8025`.

---

## 17. Scénario complet

Voici un exemple de supervision quotidienne.

1. **Ouverture** — Le responsable ouvre FutureKawa dans son navigateur (`http://localhost:5173`).

2. **Sélection du pays** — Dans le sélecteur **Pays :**, il sélectionne **Brésil**.

3. **Lecture du tableau de bord** — Il vérifie les cartes : nombre de lots, conformes, expirés, alertes actives.

4. **Consultation FIFO** — Il lit le tableau **Lots – ordre FIFO** et identifie le lot le plus ancien en premier.

5. **Sélection d'un lot** — Il clique sur le lot prioritaire pour afficher son détail.

6. **Lecture des graphiques** — Il consulte l'**Historique température / humidité** et vérifie que les courbes restent dans les plages 26–32 °C et 53–57 %.

7. **Alerte détectée** — La courbe de température dépasse 32 °C. Une alerte **Température** apparaît dans la section **Alertes actives** et le responsable reçoit une notification email.

8. **Action corrective** — Le responsable contrôle la climatisation de l'entrepôt `BR-WH-01`.

9. **Résolution automatique** — Une fois la température revenue sous 32 °C, l'alerte disparaît automatiquement de la liste. Aucune action supplémentaire n'est nécessaire.

---

## 18. FAQ

**Q : Pourquoi un lot apparaît-il en premier dans le tableau ?**
R : Parce qu'il possède la date de stockage la plus ancienne. FutureKawa trie les lots du plus ancien au plus récent (principe FIFO).

---

**Q : Pourquoi un lot est-il affiché avec le statut Expiré ?**
R : Ce lot est stocké depuis plus de 365 jours. Il doit être traité en priorité.

---

**Q : Pourquoi une alerte de température ou d'humidité a-t-elle disparu ?**
R : La valeur mesurée est revenue dans la plage acceptable. La résolution est automatique.

---

**Q : Pourquoi un graphique contient-il peu de points ?**
R : Seules les mesures reçues depuis la date de stockage du lot sont affichées. Un lot récemment créé ou peu actif aura naturellement peu de données.

---

**Q : Puis-je consulter plusieurs pays ?**
R : Dans le prototype actuel, seul le Brésil est disponible. D'autres pays pourront être ajoutés dans les futures versions.

---

**Q : Que signifie `BR-WH-01` ?**
R : Il s'agit de l'identifiant de l'entrepôt pilote du Brésil utilisé dans ce prototype.

---

**Q : Puis-je modifier un lot existant ?**
R : Non. La modification d'un lot n'est pas disponible dans ce prototype.

---

**Q : Puis-je supprimer un lot ?**
R : Non. La suppression d'un lot n'est pas disponible dans ce prototype.

---

**Q : Les données se mettent-elles à jour automatiquement ?**
R : Oui. Les lots, alertes et graphiques sont rafraîchis toutes les 10 secondes. Vous pouvez également cliquer sur **↻ Actualiser** à tout moment.

---

## 19. Limites du prototype

| Limite | Description |
|--------|-------------|
| **Un seul pays disponible** | Seul le Brésil est implémenté |
| **Un seul entrepôt** | Seul l'entrepôt `BR-WH-01` est utilisé |
| **Pas de modification de lot** | Aucun formulaire de modification n'est disponible |
| **Pas de suppression de lot** | Aucune suppression n'est possible |
| **Données simulées** | Les mesures IoT proviennent d'un simulateur en attendant les capteurs physiques |
| **Environnement de démonstration** | Cette application est un prototype MSPR, non un système de production |

---

## 20. Aide-mémoire rapide

| Action | Comment faire |
|--------|--------------|
| **Consulter les lots** | Sélecteur **Pays :** → tableau **Lots – ordre FIFO** |
| **Voir le détail d'un lot** | Cliquer sur une ligne du tableau |
| **Voir les graphiques** | Sélectionner un lot → section **Historique température / humidité** |
| **Voir les incidents** | Section **Alertes actives** |
| **Créer un lot** | Bouton **+ Ajouter un lot** → remplir le formulaire → **Créer le lot** |
| **Actualiser manuellement** | Bouton **↻ Actualiser** |

---

*FutureKawa — MSPR Bloc 4 — Prototype Brésil*
