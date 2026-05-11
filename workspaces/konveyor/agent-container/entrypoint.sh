#!/bin/bash
set -e

echo "=== Konveyor Migration Agent ==="
echo "Skill: ${SKILL:-not set}"
echo "Source repo: ${SOURCE_REPO:-not set}"
echo "Target branch: ${TARGET_BRANCH:-migration-output}"
echo "================================="

SKILL_FILE="${SKILL_DIR}/${SKILL}/SKILL.md"

if [ ! -f "$SKILL_FILE" ]; then
  echo "WARNING: Skill file not found at ${SKILL_FILE}"
  echo "Available skills:"
  ls "${SKILL_DIR}/" 2>/dev/null || echo "  (none)"
  # Fall back to flat file
  SKILL_FILE="${SKILL_DIR}/${SKILL}.md"
  if [ ! -f "$SKILL_FILE" ]; then
    echo "No skill file found. Running with generic instructions."
    SKILL_FILE=""
  fi
fi

# If we're in a workspace with code already (mounted by Tekton), just run
if [ -d ".git" ] || [ -n "$(ls -A . 2>/dev/null)" ]; then
  echo "Working directory has content, running agent in-place."
elif [ -n "$SOURCE_REPO" ]; then
  echo "Cloning ${SOURCE_REPO}..."
  git clone --branch "${SOURCE_BRANCH:-main}" "${SOURCE_REPO}" /workspace/source
  cd /workspace/source
fi

# Build the prompt
INSTRUCTIONS=""
if [ -n "$SKILL_FILE" ] && [ -f "$SKILL_FILE" ]; then
  INSTRUCTIONS="--instructions $SKILL_FILE"
  echo "Using skill: $SKILL_FILE"
fi

echo ""
echo "Running goose agent..."
echo ""

# Check that goose is available
if ! command -v goose &> /dev/null; then
  echo "ERROR: goose binary not found!"
  exit 1
fi

# Run goose
MAX_TURNS="${MAX_TURNS:-15}"
if [ -n "$INSTRUCTIONS" ]; then
  goose run --no-session --quiet --max-turns "$MAX_TURNS" $INSTRUCTIONS
else
  goose run --no-session --quiet --max-turns "$MAX_TURNS" --text "Migrate the code in this directory. Apply all necessary transformations for modernization."
fi

echo ""
echo "=== Migration Agent Complete ==="
