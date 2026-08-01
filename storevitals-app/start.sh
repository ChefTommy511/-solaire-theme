#!/bin/bash
cd /home/agent-lead/-solaire-theme/storevitals-app
set -a
[ -f .env ] && . ./.env
set +a
export PORT=3001
mkdir -p .run
nohup node node_modules/.bin/remix-serve ./build/server/index.js > .run/server.log 2>&1 &
echo "StoreVitals started on port $PORT (PID $!)"
