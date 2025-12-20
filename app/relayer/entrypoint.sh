#!/bin/sh
set -e

# If the keypair JSON is provided in KEYPAIR_JSON, write it to a file
if [ -n "$KEYPAIR_JSON" ]; then
  echo "$KEYPAIR_JSON" > /app/keypair.json
  chmod 600 /app/keypair.json
  export KEYPAIR_PATH=/app/keypair.json
fi

# If no KEYPAIR_PATH, but the file exists, set it
if [ -z "$KEYPAIR_PATH" ] && [ -f "/app/keypair.json" ]; then
  export KEYPAIR_PATH=/app/keypair.json
fi

if [ -z "$KEYPAIR_PATH" ]; then
  echo "ERROR: KEYPAIR_PATH or KEYPAIR_JSON not provided. Exiting."
  exec sleep infinity
fi

# Run the relayer
exec node dist/relayer.js
