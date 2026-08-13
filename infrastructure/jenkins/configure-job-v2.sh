#!/bin/bash
set -e

JENKINS_URL="http://localhost:8080"
USER="admin"
PASS="admin123"
COOKIE_JAR="/tmp/jenkins_cookies.txt"

echo "=== Configuration Jenkins via API avec session persistante ==="

# Step 1: login (session cookie)
curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$JENKINS_URL/j_spring_security_check" \
  --data "j_username=$USER&j_password=$PASS&from=%2F&Submit=Sign+in" \
  -L -o /dev/null
echo "1. Login effectue"

# Step 2: get crumb (SAME session)
CRUMB=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  "$JENKINS_URL/crumbIssuer/api/json" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['crumb'])")
echo "2. Crumb obtenu: ${CRUMB:0:16}..."

# Step 3: update job config.xml (SAME session + crumb)
JOB_XML='<?xml version="1.0" encoding="UTF-8"?><flow-definition plugin="workflow-job"><description>Pipeline CI/CD FutureKawa – 68 tests + 4 images Docker</description><keepDependencies>false</keepDependencies><properties/><definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps"><scm class="hudson.plugins.git.GitSCM" plugin="git"><configVersion>2</configVersion><userRemoteConfigs><hudson.plugins.git.UserRemoteConfig><url>https://github.com/ZahamIzaz/futurekawa.git</url></hudson.plugins.git.UserRemoteConfig></userRemoteConfigs><branches><hudson.plugins.git.BranchSpec><name>*/main</name></hudson.plugins.git.BranchSpec></branches><doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations><submoduleCfg class="empty-list"/><extensions/></scm><scriptPath>Jenkinsfile</scriptPath><lightweight>true</lightweight></definition><triggers/><disabled>false</disabled></flow-definition>'

HTTP_CODE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H "Jenkins-Crumb: $CRUMB" \
  -H "Content-Type: text/xml; charset=utf-8" \
  -X POST "$JENKINS_URL/job/futurekawa/config.xml" \
  --data-raw "$JOB_XML" \
  -o /dev/null \
  -w "%{http_code}")

echo "3. Update config.xml -> HTTP $HTTP_CODE"

if [ "$HTTP_CODE" != "200" ]; then
  echo "ERREUR: attendu 200, recu $HTTP_CODE"
  exit 1
fi

echo "   Job configure: Pipeline from SCM -> GitHub"

# Step 4: trigger build
BUILD_CODE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H "Jenkins-Crumb: $CRUMB" \
  -X POST "$JENKINS_URL/job/futurekawa/build" \
  -o /dev/null \
  -w "%{http_code}")

echo "4. Trigger build -> HTTP $BUILD_CODE"

if [ "$BUILD_CODE" = "201" ]; then
  echo ""
  echo "=== Pipeline lance avec succes ==="
  echo "Voir: http://localhost:8080/job/futurekawa/"
else
  echo "AVERTISSEMENT: trigger build HTTP $BUILD_CODE (peut deja etre en cours)"
fi

rm -f "$COOKIE_JAR"
