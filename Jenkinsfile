// ═══════════════════════════════════════════════════════════════════════════════
// Pipeline CI/CD FutureKawa
// ───────────────────────────────────────────────────────────────────────────────
// Stages :
//   Checkout → Install → Build → Tests → Quality → Docker → Archive
//
// Le pipeline échoue automatiquement si :
//   • une compilation TypeScript/Vite échoue
//   • un test échoue
//   • un build Docker échoue
// ═══════════════════════════════════════════════════════════════════════════════

pipeline {

    agent any

    environment {
        PROJECT   = 'futurekawa'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {

        // ─── 1. Checkout ──────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                sh 'echo "Commit : $(git rev-parse --short HEAD)"'
                sh 'echo "Branche: ${GIT_BRANCH}"'
            }
        }

        // ─── 2. Installation des dépendances ─────────────────────────────────
        // npm install est utilisé ici car les package-lock.json ont été générés sur Windows
        // et ne contiennent pas les optionalDependencies Linux d'esbuild (vitest 4.x).
        // En production avec un runner Linux natif, régénérer les lock files et utiliser npm ci.
        // chmod +x est nécessaire car npm crée parfois les scripts .bin/ sans bit exécutable.
        stage('Install') {
            parallel {
                stage('backend-country') {
                    steps {
                        dir('backend-country') {
                            sh 'npm install'
                            sh 'chmod +x node_modules/.bin/* 2>/dev/null || true'
                            // Génère les types Prisma (AlertType, LotStatus)
                            sh 'npx prisma generate'
                        }
                    }
                }
                stage('backend-central') {
                    steps {
                        dir('backend-central') {
                            sh 'npm install'
                            sh 'chmod +x node_modules/.bin/* 2>/dev/null || true'
                            // backend-central n'utilise pas Prisma
                        }
                    }
                }
                stage('frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm install'
                            sh 'chmod +x node_modules/.bin/* 2>/dev/null || true'
                        }
                    }
                }
            }
        }

        // ─── 3. Build ─────────────────────────────────────────────────────────
        // Échoue immédiatement si TypeScript ou Vite ne compile pas
        // rm -rf dist évite que les anciennes .js de test soient ramassées par vitest
        stage('Build') {
            parallel {
                stage('backend-country') {
                    steps {
                        dir('backend-country') {
                            sh 'rm -rf dist'
                            sh 'npm run build'
                        }
                    }
                }
                stage('backend-central') {
                    steps {
                        dir('backend-central') {
                            sh 'rm -rf dist'
                            sh 'npm run build'
                        }
                    }
                }
                stage('frontend') {
                    steps {
                        dir('frontend') {
                            sh 'rm -rf dist'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        // ─── 4. Tests automatisés ─────────────────────────────────────────────
        // 68 tests au total (37 + 12 + 19)
        // Produit des rapports JUnit XML dans test-results/junit.xml
        stage('Tests') {
            parallel {
                stage('backend-country') {
                    steps {
                        dir('backend-country') { sh 'npm run test:ci' }
                    }
                }
                stage('backend-central') {
                    steps {
                        dir('backend-central') { sh 'npm run test:ci' }
                    }
                }
                stage('frontend') {
                    steps {
                        dir('frontend') { sh 'npm run test:ci' }
                    }
                }
            }
        }

        // ─── 5. Contrôle Qualité ──────────────────────────────────────────────
        // Vérifie que :
        //   • les trois compilations TypeScript/Vite ont réussi (stage Build)
        //   • les rapports de tests JUnit existent et sont publiés dans Jenkins
        //     (Jenkins calcule lui-même le nombre de tests réussis/échoués)
        //
        // Note : ESLint n'est pas configuré dans ce projet ; la qualité du typage
        //        est garantie par la compilation TypeScript stricte (stage Build).
        stage('Quality') {
            steps {
                sh '''
                    echo "======================================="
                    echo "     Controle Qualite FutureKawa"
                    echo "======================================="
                    echo ""
                    echo "[BUILD]"
                    echo "  OK  backend-country  : TypeScript compile (stage Build)"
                    echo "  OK  backend-central  : TypeScript compile (stage Build)"
                    echo "  OK  frontend         : Vite + TypeScript compile (stage Build)"
                    echo ""
                    echo "[TESTS]"
                    test -f backend-country/test-results/junit.xml \
                        && echo "  OK  backend-country  : rapport JUnit present" \
                        || { echo "  KO  backend-country  : rapport JUnit ABSENT"; exit 1; }
                    test -f backend-central/test-results/junit.xml \
                        && echo "  OK  backend-central  : rapport JUnit present" \
                        || { echo "  KO  backend-central  : rapport JUnit ABSENT"; exit 1; }
                    test -f frontend/test-results/junit.xml \
                        && echo "  OK  frontend         : rapport JUnit present" \
                        || { echo "  KO  frontend         : rapport JUnit ABSENT"; exit 1; }
                '''
                // Échoue si aucun rapport n'est trouvé ; Jenkins calcule les totaux
                junit(
                    allowEmptyResults: false,
                    testResults: '**/test-results/junit.xml'
                )
            }
        }

        // ─── 6. Packaging Docker ──────────────────────────────────────────────
        // Construit les 4 images applicatives taguées avec le numéro de build
        // Utilise le Docker Engine de l'hôte via /var/run/docker.sock
        stage('Docker Build') {
            steps {
                sh "docker build -t ${PROJECT}/backend-country:${IMAGE_TAG} ./backend-country"
                sh "docker build -t ${PROJECT}/backend-central:${IMAGE_TAG} ./backend-central"
                sh "docker build -t ${PROJECT}/frontend:${IMAGE_TAG} ./frontend"
                sh "docker build -t ${PROJECT}/iot-simulator:${IMAGE_TAG} ./iot/simulator"
                sh "echo 'Images produites avec le tag :${IMAGE_TAG}'"
                sh "docker images ${PROJECT}/* --format 'table {{.Repository}}:{{.Tag}}\\t{{.Size}}'"
            }
        }

        // ─── 7. Artefacts ─────────────────────────────────────────────────────
        stage('Archive') {
            steps {
                sh """
                    echo "Build Jenkins  : #${BUILD_NUMBER}"        > build-info.txt
                    echo "Git Commit     : \$(git rev-parse HEAD)"  >> build-info.txt
                    echo "Git Branche    : ${GIT_BRANCH}"           >> build-info.txt
                    echo "Date           : \$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> build-info.txt
                    echo ""                                          >> build-info.txt
                    echo "Images Docker produits :"                 >> build-info.txt
                    echo "  ${PROJECT}/backend-country:${IMAGE_TAG}"  >> build-info.txt
                    echo "  ${PROJECT}/backend-central:${IMAGE_TAG}"  >> build-info.txt
                    echo "  ${PROJECT}/frontend:${IMAGE_TAG}"         >> build-info.txt
                    echo "  ${PROJECT}/iot-simulator:${IMAGE_TAG}"    >> build-info.txt
                    echo ""                                          >> build-info.txt
                    echo "Résultats des tests : voir rapports JUnit Jenkins" >> build-info.txt
                """
                archiveArtifacts allowEmptyArchive: true,
                    artifacts: [
                        'build-info.txt',
                        'backend-country/dist/**',
                        'backend-central/dist/**',
                        'frontend/dist/**',
                        'docs/TESTS.md',
                        'backend-country/test-results/junit.xml',
                        'backend-central/test-results/junit.xml',
                        'frontend/test-results/junit.xml'
                    ].join(', ')
            }
        }

    }

    // ─── Post-actions ─────────────────────────────────────────────────────────
    post {

        success {
            echo """
==============================================
  Pipeline FutureKawa  -  SUCCES
  Build #${BUILD_NUMBER}
  Tests automatisés validés via JUnit | 4 images Docker buildees
==============================================
"""
        }

        failure {
            echo """
==============================================
  Pipeline FutureKawa  -  ECHEC
  Build #${BUILD_NUMBER}
  Consultez les logs pour les details
==============================================
"""
        }

    }

}
