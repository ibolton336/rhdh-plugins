FROM node:22-slim

# Install git + python3 (needed for goose and repo operations)
RUN apt-get update && \
    apt-get install -y git curl python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Install goose (AI coding agent)
RUN npm install -g @anthropic-ai/claude-code || true
RUN pip3 install --break-system-packages goose-ai 2>/dev/null || true

# Create workspace
WORKDIR /workspace

# Copy migration skills
COPY skills/ /opt/migration-skills/

# Copy entrypoint
COPY entrypoint.sh /opt/entrypoint.sh
RUN chmod +x /opt/entrypoint.sh

ENV SKILL_DIR=/opt/migration-skills
ENV AGENT_TYPE=goose

ENTRYPOINT ["/opt/entrypoint.sh"]
