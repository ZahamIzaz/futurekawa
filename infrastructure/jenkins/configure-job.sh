#!/bin/bash
# Configure the futurekawa Jenkins pipeline job to use SCM

set -e

JENKINS_URL="http://localhost:8080"
USER="admin"
PASS="admin123"

echo "=== Configuration du job Jenkins futurekawa ==="

# Get crumb
CRUMB=$(curl -sf -u "$USER:$PASS" "$JENKINS_URL/crumbIssuer/api/json" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['crumb'])")
echo "Crumb obtenu: $CRUMB"

# Job config XML: Pipeline from SCM (GitHub)
JOB_CONFIG='<?xml version="1.0" encoding="UTF-8"?>
<flow-definition plugin="workflow-job">
  <description>Pipeline CI/CD FutureKawa – 68 tests + 4 images Docker</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps">
    <scm class="hudson.plugins.git.GitSCM" plugin="git">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>https://github.com/ZahamIzaz/futurekawa.git</url>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/main</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
      <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
      <submoduleCfg class="empty-list"/>
      <extensions/>
    </scm>
    <scriptPath>Jenkinsfile</scriptPath>
    <lightweight>true</lightweight>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>'

# Update job config
HTTP_STATUS=$(curl -sf -u "$USER:$PASS" \
  -H "Jenkins-Crumb: $CRUMB" \
  -H "Content-Type: text/xml; charset=utf-8" \
  -X POST "$JENKINS_URL/job/futurekawa/config.xml" \
  --data-raw "$JOB_CONFIG" \
  -o /dev/null \
  -w "%{http_code}")

echo "Update status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
  echo "Job configure avec succes : Pipeline from SCM -> GitHub"
else
  echo "ERREUR lors de la configuration (HTTP $HTTP_STATUS)"
  exit 1
fi

echo ""
echo "=== Lancement du premier build ==="
BUILD_STATUS=$(curl -sf -u "$USER:$PASS" \
  -H "Jenkins-Crumb: $CRUMB" \
  -X POST "$JENKINS_URL/job/futurekawa/build" \
  -o /dev/null \
  -w "%{http_code}")

echo "Trigger build status: $BUILD_STATUS"
echo "Voir les logs sur: http://localhost:8080/job/futurekawa/"
