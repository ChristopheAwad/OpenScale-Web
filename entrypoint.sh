#!/bin/sh
set -e

# Fix permissions for mounted volumes
chown -R appuser:appgroup /app/data /app/uploads

# Execute the command as appuser
exec su-exec appuser "$@"
