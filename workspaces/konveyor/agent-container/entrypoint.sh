#!/bin/bash
set -e

echo "=== Migration Agent ==="
echo "Agent type: ${AGENT_TYPE}"
echo "Skill: ${SKILL}"
echo "Source repo: ${SOURCE_REPO:-not set}"
echo "Target branch: ${TARGET_BRANCH:-migration-output}"
echo "LLM Provider: ${LLM_PROVIDER:-default}"
echo "========================"

SKILL_FILE="${SKILL_DIR}/${SKILL}/SKILL.md"

if [ ! -f "$SKILL_FILE" ]; then
  echo "WARNING: Skill file not found at ${SKILL_FILE}"
  echo "Available skills:"
  ls -la ${SKILL_DIR}/ 2>/dev/null || echo "  (none)"
  SKILL_FILE=""
fi

# Clone source if provided
if [ -n "$SOURCE_REPO" ]; then
  echo "Cloning ${SOURCE_REPO}..."
  git clone --branch "${SOURCE_BRANCH:-main}" "${SOURCE_REPO}" /workspace/source
  cd /workspace/source
fi

# Build the prompt
PROMPT="You are a migration agent. "
if [ -n "$SKILL_FILE" ]; then
  PROMPT="${PROMPT}Follow the instructions in this migration skill:\n\n$(cat $SKILL_FILE)\n\n"
fi
PROMPT="${PROMPT}Migrate this codebase from its current technology to the target technology. Make all necessary code changes."

echo "Running ${AGENT_TYPE} agent..."

case "$AGENT_TYPE" in
  goose)
    if command -v goose &> /dev/null; then
      echo "$PROMPT" | goose run --text -
    else
      echo "goose binary not found, simulating..."
      echo "SIMULATED: Would run goose with skill ${SKILL}"
      echo "SIMULATED: Migration complete"
    fi
    ;;
  *)
    echo "Unknown agent type: ${AGENT_TYPE}"
    echo "SIMULATED: Migration complete"
    ;;
esac

# Push branch if in a git repo
if [ -d .git ] && [ -n "$TARGET_BRANCH" ]; then
  echo "Creating branch ${TARGET_BRANCH}..."
  git checkout -b "${TARGET_BRANCH}" 2>/dev/null || git checkout "${TARGET_BRANCH}"
  git add -A
  git commit -m "feat: AI-assisted migration using skill ${SKILL}" --allow-empty
  
  if [ -n "$GIT_TOKEN" ]; then
    echo "Pushing to remote..."
    git push origin "${TARGET_BRANCH}"
    echo "PR_URL=$(git remote get-url origin | sed 's/.git$//')/compare/${TARGET_BRANCH}"
  else
    echo "No GIT_TOKEN set, skipping push"
    echo "PR_URL=pending-push"
  fi
fi

echo "=== Migration Agent Complete ==="
