#!/bin/bash
# Debug: check Jenkins API access

JENKINS_URL="http://localhost:8080"
USER="admin"
PASS="admin123"

echo "--- Test 1: get crumb ---"
CRUMB_RESP=$(curl -s -u "$USER:$PASS" "$JENKINS_URL/crumbIssuer/api/json")
echo "Crumb resp: $CRUMB_RESP"
CRUMB=$(echo "$CRUMB_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['crumb'])")
echo "Crumb: $CRUMB"

echo "--- Test 2: get job info ---"
curl -s -u "$USER:$PASS" -H "Jenkins-Crumb: $CRUMB" "$JENKINS_URL/job/futurekawa/api/json?tree=name" 2>&1
echo ""

echo "--- Test 3: post config.xml ---"
JOB_CONFIG='<?xml version="1.0" encoding="UTF-8"?><flow-definition plugin="workflow-job"><description>test</description><keepDependencies>false</keepDependencies><properties/><definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps"><scm class="hudson.plugins.git.GitSCM" plugin="git"><configVersion>2</configVersion><userRemoteConfigs><hudson.plugins.git.UserRemoteConfig><url>https://github.com/ZahamIzaz/futurekawa.git</url></hudson.plugins.git.UserRemoteConfig></userRemoteConfigs><branches><hudson.plugins.git.BranchSpec><name>*/main</name></hudson.plugins.git.BranchSpec></branches><doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations><submoduleCfg class="empty-list"/><extensions/></scm><scriptPath>Jenkinsfile</scriptPath><lightweight>true</lightweight></definition><triggers/><disabled>false</disabled></flow-definition>'

curl -v -u "$USER:$PASS" \
  -H "Jenkins-Crumb: $CRUMB" \
  -H "Content-Type: text/xml; charset=utf-8" \
  -X POST "$JENKINS_URL/job/futurekawa/config.xml" \
  --data-raw "$JOB_CONFIG" \
  2>&1 | grep -E "< HTTP|< |error|Error"

echo ""
echo "--- Done ---"
