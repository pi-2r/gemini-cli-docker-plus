FROM alpine:3.23

# set some defaults
ENV DEBUG=false

VOLUME /tmp /var/cache/apk /var/tmp /root/.cache /root/.npm

# Setup unprivileged user defaults
COPY usr/ /usr/
RUN apk upgrade --no-cache && \
    apk add --no-cache su-exec bubblewrap && \
    chmod +x /usr/local/sbin/docker-entrypoint.sh

# Install Gemini CLI and Wrapper
ARG GEMINI_CLI_VERSION="latest"
ARG TARGETPLATFORM

# Prepare application directory
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src/ src/

RUN apk add --no-cache nodejs npm && \
    if [ "$TARGETPLATFORM" != "linux/amd64" ]; then \
        apk add --no-cache python3 py3-pip build-base git; \
    fi && \
    # Install Gemini CLI global
    npm install -g @google/gemini-cli@${GEMINI_CLI_VERSION} && \
    # Install wrapper dependencies and build
    npm install && \
    npm run build && \
    # Cleanup
    npm prune --production && \
    rm -rf ~/.npm && \
    apk del --no-cache npm && \
    if [ "$TARGETPLATFORM" != "linux/amd64" ]; then \
        apk del --no-cache python3 py3-pip build-base git; \
    fi && \
    gemini --version

WORKDIR /home/gemini/workspace
ENTRYPOINT ["/usr/local/sbin/docker-entrypoint.sh", "node", "/app/dist/index.js"]
