# Migration Intelligence — Deployment

Deploy the Migration Intelligence plugin on any OpenShift cluster with RHDH.

## Quick Start

```bash
# From the workspaces/konveyor directory:
./deploy/deploy.sh
```

## Prerequisites

- OpenShift cluster with `oc` CLI authenticated
- Docker or Podman (for building the OCI plugin image)
- Node 22+ with corepack enabled (`corepack enable`)
- `quay.io` login for pushing the image (`docker login quay.io`)

## Configuration

Override defaults via environment variables:

```bash
NAMESPACE=my-rhdh IMAGE=quay.io/myorg/migration-intelligence:v1 ./deploy/deploy.sh
```

| Variable | Default | Description |
|----------|---------|-------------|
| `NAMESPACE` | `rhdh` | OpenShift namespace |
| `IMAGE` | `quay.io/ibolton/migration-intelligence:latest` | OCI image tag |
| `PLATFORM` | `linux/amd64` | Container platform |
| `CONTAINER_TOOL` | `docker` | `docker` or `podman` |

## What Gets Deployed

1. **RHDH Operator** (if not already installed) — via Subscription on `fast-1.9` channel
2. **App config** — guest auth + catalog location for migration-candidate entities
3. **Dynamic plugins config** — references the OCI plugin image
4. **Backstage CR** — creates the RHDH instance
5. **Catalog entities** — 5 sample migration-candidate Components (ingested from GitHub)

## Manual Steps (if needed)

### Build only (no deploy):
```bash
cd workspaces/konveyor
yarn install && yarn tsc
cd plugins/migration-intelligence && npx @janus-idp/cli package export-dynamic-plugin --clean && cd ../..
cd plugins/migration-intelligence-backend && npx @janus-idp/cli package export-dynamic-plugin --clean && cd ../..
npx @janus-idp/cli package package-dynamic-plugins --tag quay.io/ibolton/migration-intelligence:latest --container-tool docker --platform linux/amd64
docker push quay.io/ibolton/migration-intelligence:latest
```

### Redeploy after code changes:
```bash
oc rollout restart deployment/backstage-developer-hub -n rhdh
```

### Check status:
```bash
oc get pods -n rhdh
oc logs deploy/backstage-developer-hub -n rhdh | grep migration-intelligence
```

## Local Development

Use `rhdh-local` (Docker Compose) for faster iteration:

```bash
git clone https://github.com/redhat-developer/rhdh-local /tmp/rhdh-local
cd /tmp/rhdh-local

# Copy plugin builds into local-plugins/
cp -r /path/to/plugins/migration-intelligence/dist-dynamic local-plugins/red-hat-developer-hub-backstage-plugin-migration-intelligence
cp -r /path/to/plugins/migration-intelligence-backend/dist-dynamic local-plugins/red-hat-developer-hub-backstage-plugin-migration-intelligence-backend
chmod -R a+rX local-plugins/

# Add to configs/dynamic-plugins/dynamic-plugins.override.yaml (see deploy/local/dynamic-plugins.override.yaml)
# Set SKIP_INTEGRITY_CHECK=true in default.env

docker compose up -d
# Plugin available at http://localhost:7007/migration-intelligence
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│  RHDH (Backstage)                               │
│                                                 │
│  ┌──────────────────┐  ┌────────────────────┐  │
│  │ Frontend Plugin   │  │ Backend Plugin      │  │
│  │ (dynamic)        │  │ (dynamic)           │  │
│  │                  │  │                     │  │
│  │ Dashboard        │──│ /api/migration-     │  │
│  │ Agents           │  │   intelligence/     │  │
│  │ Pipelines        │  │                     │  │
│  │ Start Migration  │  │ ┌─────────────────┐ │  │
│  └──────────────────┘  │ │KubernetesService│ │  │
│           │            │ │(in-cluster)     │ │  │
│           ▼            │ └────────┬────────┘ │  │
│  ┌──────────────────┐  │          │          │  │
│  │ Backstage Catalog │  │          ▼          │  │
│  │ (catalog API)     │  │  Tekton PipelineRun │  │
│  │                  │  │  (migration-agent)  │  │
│  │ konveyor.io/*    │  └────────────────────┘  │
│  │ annotations      │                          │
│  └──────────────────┘                          │
└─────────────────────────────────────────────────┘
```
