#!/bin/bash

# Test script for Silo API endpoints

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Testing Silo API Endpoints"
echo "=============================="

# Test Health
echo -e "\n Testing /health"
curl -s $BASE_URL/health | jq '.'

# Register a test user
echo -e "\n Testing POST /api/auth/register"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }')

echo $REGISTER_RESPONSE | jq '.'
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')

if [ "$TOKEN" != "null" ]; then
  echo -e "${GREEN} Registration successful${NC}"
else
  echo -e "${RED} Registration failed${NC}"
  exit 1
fi

# Get current user
echo -e "\nTesting GET /api/auth/me"
curl -s $BASE_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Get integrations
echo -e "\nTesting GET /api/integrations"
curl -s $BASE_URL/api/integrations \
  -H "Authorization: Bearer $TOKEN" | jq '.integrations | length'

# Get available nodes
echo -e "\nTesting GET /api/nodes"
curl -s $BASE_URL/api/nodes \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Create a workflow
echo -e "\nTesting POST /api/workflows"
WORKFLOW_RESPONSE=$(curl -s -X POST $BASE_URL/api/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "description": "A simple test workflow",
    "nodes": [
      {
        "id": "node-1",
        "type": "start",
        "position": { "x": 100, "y": 100 },
        "data": { "label": "Start" }
      },
      {
        "id": "node-2",
        "type": "httpRequest",
        "position": { "x": 300, "y": 100 },
        "data": {
          "label": "API Call",
          "url": "https://api.github.com/users/github",
          "method": "GET"
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2"
      }
    ],
    "trigger": {
      "type": "manual",
      "config": {}
    }
  }')

echo $WORKFLOW_RESPONSE | jq '.'
WORKFLOW_ID=$(echo $WORKFLOW_RESPONSE | jq -r '.workflow.id')

if [ "$WORKFLOW_ID" != "null" ]; then
  echo -e "${GREEN} Workflow created successfully${NC}"
else
  echo -e "${RED} Workflow creation failed${NC}"
  exit 1
fi

# Get all workflows
echo -e "\n Testing GET /api/workflows"
curl -s $BASE_URL/api/workflows \
  -H "Authorization: Bearer $TOKEN" | jq '.workflows | length'

# Execute workflow
echo -e "\n Testing POST /api/workflows/:id/execute"
EXECUTION_RESPONSE=$(curl -s -X POST $BASE_URL/api/workflows/$WORKFLOW_ID/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

echo $EXECUTION_RESPONSE | jq '.'
EXECUTION_ID=$(echo $EXECUTION_RESPONSE | jq -r '.executionId')

if [ "$EXECUTION_ID" != "null" ]; then
  echo -e "${GREEN} Workflow execution started${NC}"
else
  echo -e "${RED} Workflow execution failed${NC}"
  exit 1
fi

# Wait a bit for execution to complete
sleep 3

# Get execution details
echo -e "\n Testing GET /api/executions/:id"
curl -s $BASE_URL/api/executions/$EXECUTION_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n${GREEN} All tests completed successfully!${NC}"
