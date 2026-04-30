#!/bin/sh
set -e

# Support PUID/PGID for host permission matching (Unraid convention: PUID=99, PGID=100)
PUID=${PUID:-1001}
PGID=${PGID:-1001}

# Update appuser/appgroup to match host UID/GID
if [ "$PUID" != "1001" ] || [ "$PGID" != "1001" ]; then
    # Change GID first (usermod requires group to exist with target GID)
    groupmod -g $PGID appgroup 2>/dev/null || true
    usermod -u $PUID -g $PGID appuser 2>/dev/null || true
fi

# Fix permissions on mounted volumes
chown -R appuser:appgroup /app/data /app/uploads

# Execute the command as appuser
exec su-exec appuser "$@"
