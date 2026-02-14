#!/bin/bash

set -eu

USER_ID=${DEFAULT_UID:-1000}
GROUP_ID=${DEFAULT_GID:-1000}
USER=${DEFAULT_USERNAME:-gemini}
HOME=${DEFAULT_HOME_DIR:-/home/$USER}

# create group if it doesn't exist
getent group $GROUP_ID 2>&1 > /dev/null || groupadd -g $GROUP_ID $USER > /dev/null 2>&1

# create user if it doesn't exist
# Note: We use useradd (Debian) instead of adduser (Alpine)
getent passwd $USER_ID 2>&1 > /dev/null || useradd -m -d "$HOME" -u $USER_ID -g $GROUP_ID -s /bin/bash $USER > /dev/null 2>&1

# Ensure .npm directory exists and is owned by the user
mkdir -p "$HOME/.npm"
chown "$USER_ID:$GROUP_ID" "$HOME/.npm"

exec gosu "${USER_ID}:${GROUP_ID}" "$@"
