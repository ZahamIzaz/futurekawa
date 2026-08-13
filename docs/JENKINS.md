# Pipeline CI/CD Jenkins – FutureKawa MSPR Bloc 4

## Vue d'ensemble

Jenkins CI/CD entièrement conteneurisé, intégré au projet FutureKawa.  
Le pipeline exécute **68 tests unitaires** (37 + 12 + 19) et construit **4 images Docker** à chaque push sur `main`.

---

## Architecture du pipeline

```
GitHub (main)
      │
      │  push / déclenchement manuel
      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Jenkins LTS 2.541.3                       │
│                  (conteneur Docker, port 8080)               │
│                                                              │
│  Stage 1 ── Checkout                                         │
│             git clone depuis https://github.com/ZahamIzaz/  │
│             futurekawa.git (branche main)                    │
│                                                              │
│  Stage 2 ── Install (parallèle × 3 composants)              │
│             npm install + chmod .bin + prisma generate       │
│                                                              │
│  Stage 3 ── Build (parallèle × 3 composants)                │
│             tsc + vite build / esbuild                       │
│                                                              │
│  Stage 4 ── Tests (parallèle × 3 composants)                │
│             Vitest → 37 + 12 + 19 = 68 tests                 │
│             Sortie : test-results/junit.xml × 3              │
│                                                              │
│  Stage 5 ── Quality Gate                                     │
│             Vérifie la présence des 3 rapports JUnit         │
│             junit() → rapport visible dans l'UI Jenkins      │
│                                                              │
│  Stage 6 ── Docker Build (parallèle × 4 services)           │
│             backend-country:N  backend-central:N             │
│             frontend:N         iot-simulator:N               │
│             (N = BUILD_NUMBER Jenkins)                       │
│                                                              │
│  Stage 7 ── Archive                                          │
│             build-info.txt + junit.xml archivés             │
└─────────────────────────────────────────────────────────────┘
```

**Règle d'échec** : le pipeline s'arrête (`FAILURE`) dès qu'une compilation, un test ou un build Docker échoue.

---

## Prérequis

- Docker Desktop (ou Docker Engine) installé et démarré  
- Ports libres : **8080** (Jenkins UI), **50000** (agents JNLP)  
- Le fichier `.env` à la racine du projet (variables PostgreSQL, MQTT, etc.)

---

## Démarrer Jenkins

```bash
# Depuis la racine du projet
docker compose --profile ci up -d jenkins
```

Jenkins démarre sur **http://localhost:8080**.

> **Première utilisation uniquement** : le mot de passe initial se trouve dans les logs du conteneur.
>
> ```bash
> docker logs futurekawa_jenkins | grep -A 5 "initial Admin"
> # ou
> docker exec futurekawa_jenkins cat /var/jenkins_home/secrets/initialAdminPassword
> ```

**Identifiants configurés** : `admin` / `admin123`

---

## Arrêter Jenkins

```bash
docker compose --profile ci stop jenkins
```

Les données Jenkins (jobs, builds, configurations) sont persistées dans le volume nommé `jenkins_home`.

---

## Créer le job Jenkins (si nouveau volume)

1. Ouvrir **http://localhost:8080** et se connecter
2. **Nouveau Item** → saisir `futurekawa` → choisir **Pipeline** → OK
3. Section **Pipeline** :
   - Definition : `Pipeline script from SCM`
   - SCM : `Git`
   - Repository URL : `https://github.com/ZahamIzaz/futurekawa.git`
   - Branch Specifier : `*/main`
   - Script Path : `Jenkinsfile`
4. **Sauvegarder**
5. Cliquer **Lancer un build**

---

## Résultats du pipeline (build #7)

| Stage          | Statut  | Durée approx. |
|----------------|---------|---------------|
| Checkout       | ✅ PASS | ~10 s         |
| Install        | ✅ PASS | ~45 s         |
| Build          | ✅ PASS | ~30 s         |
| Tests          | ✅ PASS | ~20 s         |
| Quality Gate   | ✅ PASS | ~3 s          |
| Docker Build   | ✅ PASS | ~3 min        |
| Archive        | ✅ PASS | ~5 s          |

### Tests unitaires

| Composant        | Fichiers | Tests | Framework |
|------------------|----------|-------|-----------|
| backend-country  | 6        | 37    | Vitest    |
| backend-central  | 1        | 12    | Vitest    |
| frontend         | 6        | 19    | Vitest    |
| **Total**        | **13**   | **68**|           |

### Images Docker produites

| Image                         | Tag | Taille  |
|-------------------------------|-----|---------|
| `futurekawa/backend-country`  | 7   | 907 MB  |
| `futurekawa/backend-central`  | 7   | 338 MB  |
| `futurekawa/frontend`         | 7   | 93 MB   |
| `futurekawa/iot-simulator`    | 7   | 258 MB  |

---

## Rapports JUnit dans Jenkins UI

Après chaque build réussi, les rapports JUnit sont accessibles depuis :

```
http://localhost:8080/job/futurekawa/<N>/testReport/
```

Jenkins affiche l'historique de passage des tests build par build (courbe de tendance).

---

## Structure des fichiers CI/CD

```
futurekawa_bloc4/
├── Jenkinsfile                          ← Pipeline déclaratif (7 stages)
├── docker-compose.yml                   ← Service jenkins (profil: ci)
├── infrastructure/
│   └── jenkins/
│       └── Dockerfile                   ← Jenkins LTS + Node 22 + Docker CLI
├── backend-country/
│   ├── vitest.config.ts                 ← include: src/**/*.{test,spec}.ts
│   └── package.json                     ← script test:ci
├── backend-central/
│   ├── vitest.config.ts
│   └── package.json                     ← script test:ci
└── frontend/
    ├── vite.config.ts                   ← section test: avec jsdom
    └── package.json                     ← script test:ci
```

---

## Notes techniques

### Docker-in-Docker (DinD)

Le socket Docker de l'hôte est monté dans le conteneur Jenkins :

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
group_add:
  - "0"   # GID 0 = groupe root, propriétaire du socket sur Docker Desktop
```

Jenkins peut ainsi construire des images Docker sans Docker-in-Docker (DinD) séparé.

### Node.js 22 dans Jenkins

Node.js 22 est installé dans l'image Jenkins via NodeSource. Les scripts npm `.bin/` sont rendus exécutables avec `chmod +x node_modules/.bin/*` pour contourner un comportement de npm sur Linux.

### Prisma (backend-country)

`npx prisma generate` est exécuté dans le stage Install pour générer les types TypeScript nécessaires à la compilation.
