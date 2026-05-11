FROM debian:bookworm-slim

# Install system deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends git curl ca-certificates bzip2 libgomp1 && \
    rm -rf /var/lib/apt/lists/*

# Install Goose (Block's AI agent - Rust binary)
ARG GOOSE_VERSION=v1.33.1
RUN curl -fsSL "https://github.com/aaif-goose/goose/releases/download/${GOOSE_VERSION}/goose-x86_64-unknown-linux-gnu.tar.bz2" | \
    tar -xj -C /usr/local/bin && \
    chmod +x /usr/local/bin/goose && \
    goose --version

# Create directories
WORKDIR /workspace
RUN mkdir -p /skills

# Copy migration skills
COPY skills/ /skills/

# Copy entrypoint
COPY entrypoint.sh /opt/entrypoint.sh
RUN chmod +x /opt/entrypoint.sh

ENV SKILL_DIR=/skills
ENV AGENT_TYPE=goose

ENTRYPOINT ["/opt/entrypoint.sh"]
