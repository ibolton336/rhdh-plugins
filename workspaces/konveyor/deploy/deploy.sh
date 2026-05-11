#!/usr/bin/env bash
set -euo pipefail

# Migration Intelligence Plugin — Full Deploy Script
# Deploys RHDH + migration-intelligence plugin on an OpenShift cluster
#
# Prerequisites:
#   - oc CLI authenticated to target cluster
#   - docker (or podman) for building OCI image
#   - Node 22+, yarn (corepack)
#   - quay.io login (for pushing plugin image)
#
# Usage:
#   ./deploy.sh [--namespace rhdh] [--image quay.io/yourorg/migration-intelligence:latest]

NAMESPACE="${NAMESPACE:-rhdh}"
IMAGE="${IMAGE:-quay.io/ibolton/migration-intelligence:latest}"
PLATFORM="${PLATFORM:-linux/amd64}"
CONTAINER_TOOL="${CONTAINER_TOOL:-docker}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Migration Intelligence Plugin Deployment ==="
echo "  Namespace:  $NAMESPACE"
echo "  Image:      $IMAGE"
echo "  Platform:   $PLATFORM"
echo "  Workspace:  $WORKSPACE_DIR"
echo ""

# --- Step 1: Build the plugins ---
echo "==> Step 1: Building plugins..."
cd "$WORKSPACE_DIR"

# Install deps
yarn install

# Generate .d.ts files (needed for backend)
yarn tsc

# Export frontend as dynamic plugin
echo "  Building frontend plugin..."
cd plugins/migration-intelligence
npx @janus-idp/cli package export-dynamic-plugin --clean
cd "$WORKSPACE_DIR"

# Export backend as dynamic plugin
echo "  Building backend plugin..."
cd plugins/migration-intelligence-backend
npx @janus-idp/cli package export-dynamic-plugin --clean
cd "$WORKSPACE_DIR"

echo "  ✓ Plugins built"

# --- Step 2: Package as OCI image and push ---
echo "==> Step 2: Packaging and pushing OCI image..."
npx @janus-idp/cli package package-dynamic-plugins \
  --tag "$IMAGE" \
  --container-tool "$CONTAINER_TOOL" \
  --platform "$PLATFORM"

$CONTAINER_TOOL push "$IMAGE"
echo "  ✓ Image pushed to $IMAGE"

# --- Step 3: Create namespace if needed ---
echo "==> Step 3: Setting up namespace..."
oc get namespace "$NAMESPACE" >/dev/null 2>&1 || oc create namespace "$NAMESPACE"

# --- Step 4: Install RHDH Operator (if not present) ---
echo "==> Step 4: Checking RHDH Operator..."
if ! oc get csv -n "$NAMESPACE" 2>/dev/null | grep -q "rhdh-operator"; then
  echo "  RHDH Operator not found. Applying subscription..."
  oc apply -f "$SCRIPT_DIR/manifests/operator-subscription.yaml"
  echo "  Waiting for operator to be ready (this may take a few minutes)..."
  sleep 30
  oc wait --for=condition=CatalogSourcesUnhealthy=False subscription/rhdh-operator -n openshift-operators --timeout=300s 2>/dev/null || true
else
  echo "  ✓ RHDH Operator already installed"
fi

# --- Step 5: Apply cluster manifests ---
echo "==> Step 5: Applying manifests..."

# Apply app-config
envsubst < "$SCRIPT_DIR/manifests/app-config.yaml" | oc apply -n "$NAMESPACE" -f -

# Apply dynamic-plugins config
sed "s|__IMAGE__|$IMAGE|g" "$SCRIPT_DIR/manifests/dynamic-plugins.yaml" | oc apply -n "$NAMESPACE" -f -

# Apply Backstage CR
oc apply -n "$NAMESPACE" -f "$SCRIPT_DIR/manifests/backstage-cr.yaml"

echo "  ✓ Manifests applied"

# --- Step 6: Wait for rollout ---
echo "==> Step 6: Waiting for RHDH to be ready..."
oc rollout status deployment/backstage-developer-hub -n "$NAMESPACE" --timeout=300s 2>/dev/null || {
  echo "  Rollout in progress — check with: oc get pods -n $NAMESPACE"
}

# --- Step 7: Get route ---
echo ""
echo "=== Deployment Complete ==="
ROUTE=$(oc get route backstage-developer-hub -n "$NAMESPACE" -o jsonpath='{.spec.host}' 2>/dev/null || echo "")
if [ -n "$ROUTE" ]; then
  echo "  RHDH URL: https://$ROUTE"
  echo "  Plugin:   https://$ROUTE/migration-intelligence"
else
  echo "  Route not found — check: oc get routes -n $NAMESPACE"
fi
echo ""
echo "Catalog entities will be ingested automatically from the GitHub location."
echo "It may take 1-2 minutes for all 5 apps to appear in the catalog."
