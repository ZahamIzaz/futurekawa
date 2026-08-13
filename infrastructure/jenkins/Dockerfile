# ═══════════════════════════════════════════════════════════════════════════════
# Image Jenkins personnalisée pour FutureKawa CI/CD
#
# Contenu :
#   - Jenkins LTS (JDK 17)
#   - Node.js 22 (pour npm ci / build / tests)
#   - Docker CLI (pour construire les images applicatives)
#   - Plugins Jenkins pré-installés
#
# ⚠  AVERTISSEMENT SÉCURITÉ – Docker socket
# ──────────────────────────────────────────
# Le montage de /var/run/docker.sock dans ce conteneur accorde à Jenkins
# un accès complet au Docker Engine de l'hôte (équivalent root sur l'hôte).
# Cette configuration est acceptable dans un environnement de DÉMONSTRATION
# locale où l'hôte est de confiance.
# Elle N'EST PAS recommandée en production : préférer Kaniko, BuildKit rootless
# ou un agent Docker dédié avec accès restreint.
# ═══════════════════════════════════════════════════════════════════════════════

FROM jenkins/jenkins:lts-jdk17

USER root

# ── Installation Node.js 22 ────────────────────────────────────────────────────
# Via le dépôt officiel NodeSource (Debian bookworm)
RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# ── Installation Docker CLI ────────────────────────────────────────────────────
# Installe uniquement le client Docker (le daemon tourne sur l'hôte via le socket)
RUN apt-get update && \
    apt-get install -y docker.io && \
    rm -rf /var/lib/apt/lists/*

# Ajouter l'utilisateur jenkins au groupe docker pour accéder au socket
RUN usermod -aG docker jenkins

USER jenkins

# ── Pré-installation des plugins Jenkins ──────────────────────────────────────
# Stockés dans /usr/share/jenkins/ref/plugins/
# Jenkins les copie vers $JENKINS_HOME au premier démarrage (via jenkins-support)
#
# Plugins installés :
#   workflow-aggregator  → Pipeline (Declarative + Scripted)
#   git                  → Checkout SCM depuis Git/GitHub
#   junit                → Publication des rapports de tests XML
#   pipeline-stage-view  → Vue graphique des stages dans l'interface
RUN jenkins-plugin-cli \
    --plugin-download-directory /usr/share/jenkins/ref/plugins \
    --plugins "workflow-aggregator git junit pipeline-stage-view"
