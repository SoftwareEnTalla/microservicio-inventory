#!/usr/bin/env bash
set -euo pipefail
PORT=${PORT:-3012}
BASE_API="http://localhost:${PORT}/api"
RESOURCE="inventorys"
BASE_URL="${BASE_API}/${RESOURCE}"
wait_for(){ until curl -sSf ${BASE_API}/${RESOURCE}/query >/dev/null 2>&1; do printf "."; sleep 1; done }
echo "Waiting for inventory-service on ${BASE_URL}..."
wait_for
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_API}/${RESOURCE}/command -H 'Content-Type: application/json' -d '{"sku":"sku-test","stock":100}')
HTTP=$(echo "$CREATE_RESPONSE" | tail -n1)
BODY=$(echo "$CREATE_RESPONSE" | sed '$d')
if [[ "$HTTP" != "201" && "$HTTP" != "200" ]]; then echo "Create failed: $HTTP"; exit 1; fi
ID=$(echo "$BODY" | jq -r '.id // .sku // empty')
curl -sSf ${BASE_API}/${RESOURCE}/query/${ID} >/dev/null
curl -s -f ${BASE_API}/${RESOURCE}/query | jq . >/dev/null
curl -s -X PUT ${BASE_API}/${RESOURCE}/command/${ID} -H 'Content-Type: application/json' -d '{"stock":90}' >/dev/null
curl -s -X DELETE ${BASE_API}/${RESOURCE}/command/${ID} >/dev/null
echo "inventory-service e2e: OK"
