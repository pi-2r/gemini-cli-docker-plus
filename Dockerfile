FROM node:22-slim

# set some defaults
ENV DEBUG=false

# Install dependencies (Debian/Ubuntu)
RUN apt-get update && apt-get install -y \
    gosu \
    bubblewrap \
    git \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Remove default node user to avoid UID 1000 conflict if we want to remap it
RUN userdel -r node || true

# Setup unprivileged user defaults
COPY usr/ /usr/
RUN chmod +x /usr/local/sbin/docker-entrypoint.sh

# Install Gemini CLI and Wrapper
ARG GEMINI_CLI_VERSION="latest"

WORKDIR /app
COPY package.json tsconfig.json ./
COPY src/ src/

RUN npm install -g @google/gemini-cli@${GEMINI_CLI_VERSION} && \
    # Install wrapper dependencies and build
    npm install && \
    npm run build && \
    # Cleanup
    npm prune --production && \
    rm -rf ~/.npm && \
    gemini --version

WORKDIR /home/gemini/workspace
ENTRYPOINT ["/usr/local/sbin/docker-entrypoint.sh", "node", "/app/dist/index.js"]
