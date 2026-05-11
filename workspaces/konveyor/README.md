# Migration Intelligence — Konveyor Workspace

AI-powered application migration orchestration for Red Hat Developer Hub (RHDH).

## What It Does

1. **Discovers** migration candidates from the Backstage catalog (annotated with `konveyor.io/*`)
2. **Orchestrates** migrations via Tekton Pipelines on OpenShift
3. **Executes** AI agents (Goose + Claude via AWS Bedrock) against source code
4. **Tracks** progress in real-time with live logs and step visualization
5. **Pushes** migrated code to a branch and opens a PR

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  RHDH (Backstage)                                       │
│                                                         │
│  ┌────────────────────┐    ┌─────────────────────────┐  │
│  │  Frontend Plugin    │    │  Backend Plugin          │  │
│  │                    │    │                           │  │
│  │  • Dashboard       │───▶│  POST /migrations        │  │
│  │  • Start Migration │    │  GET  /migrations        │  │
│  │  • Migrations Tab  │◀───│  GET  /migrations/:id    │  │
│  │  • Live Logs       │    │                           │  │
│  │  • Results View    │    │  ┌───────────────────┐   │  │
│  └────────────────────┘    │  │ KubernetesService │   │  │
│           │                │  └─────────┬─────────┘   │  │
│           ▼                └────────────┼─────────────┘  │
│  ┌────────────────────┐                │                 │
│  │  Catalog API        │                ▼                 │
│  │  (konveyor.io/*)    │    ┌─────────────────────────┐  │
│  └────────────────────┘    │  Tekton PipelineRun      │  │
│                            │                           │  │
│                            │  Step 1: git clone        │  │
│                            │  Step 2: goose + Claude   │  │
│                            │  Step 3: git push + PR    │  │
│                            └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# One-command deploy on any OpenShift cluster with RHDH
./deploy/deploy.sh
```

See [deploy/README.md](./deploy/README.md) for full instructions.

## Directory Structure

```
workspaces/konveyor/
├── plugins/
│   ├── migration-intelligence/        # Frontend plugin (React)
│   │   └── src/
│   │       ├── components/
│   │       │   ├── MigrationDashboardPage/  # Main dashboard + stats
│   │       │   ├── MigrationsPage/          # Live progress + logs
│   │       │   ├── AgentDefinitionsPage/    # Agent management
│   │       │   ├── PipelineDefinitionsPage/ # Pipeline management
│   │       │   └── StartMigrationDialog/    # Trigger migrations
│   │       ├── hooks/                 # Data fetching (catalog, API)
│   │       └── api/                   # Backend API client
│   └── migration-intelligence-backend/ # Backend plugin (Node.js)
│       └── src/
│           ├── router.ts              # REST API endpoints
│           └── service/
│               ├── KubernetesService.ts  # Tekton PipelineRun management
│               └── DatabaseService.ts    # Persistence (SQLite)
├── agent-container/                   # Migration agent Docker image
│   ├── Dockerfile                     # Goose v1.33.1 (Rust binary)
│   ├── entrypoint.sh                  # Agent orchestration script
│   └── skills/                        # Bundled migration skills
│       └── java-ee-to-quarkus/
├── catalog-entities/                  # Backstage catalog YAMLs
│   ├── all.yaml                       # Location entity
│   └── coolstore.yaml                 # Migration candidate
└── deploy/                            # Deployment automation
    ├── deploy.sh                      # One-command setup
    ├── README.md                      # Full deployment docs
    ├── manifests/                     # K8s/OpenShift manifests
    │   ├── app-config.yaml
    │   ├── backstage-cr.yaml
    │   ├── dynamic-plugins.yaml
    │   ├── operator-subscription.yaml
    │   ├── tekton-pipeline.yaml
    │   └── tekton-task.yaml
    └── local/                         # Docker Compose config
        └── dynamic-plugins.override.yaml
```

## Configuration

### Required Secrets

```bash
# LLM + Git credentials
oc create secret generic migration-agent-llm -n rhdh \
  --from-literal=AWS_ACCESS_KEY_ID='...' \
  --from-literal=AWS_SECRET_ACCESS_KEY='...' \
  --from-literal=AWS_REGION='us-east-1' \
  --from-literal=GOOSE_PROVIDER='aws_bedrock' \
  --from-literal=GOOSE_MODEL='us.anthropic.claude-sonnet-4-20250514-v1:0' \
  --from-literal=GIT_TOKEN='ghp_...'
```

### Catalog Entity Annotations

Tag any Backstage Component as a migration candidate:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-app
  tags:
    - migration-candidate
  annotations:
    github.com/project-slug: org/repo
    konveyor.io/source-technology: java-ee-7
    konveyor.io/target-technology: quarkus-3.8
    konveyor.io/migration-status: pending
    konveyor.io/complexity: high
```

### GitHub Auth Provider (recommended)

Instead of a shared PAT, configure RHDH's GitHub OAuth:

```yaml
# app-config-rhdh.yaml
auth:
  environment: production
  providers:
    github:
      production:
        clientId: ${GITHUB_CLIENT_ID}
        clientSecret: ${GITHUB_CLIENT_SECRET}
```

This allows per-user tokens — PRs are authored by the actual user.

## Adding New Skills

1. Create a skill directory under `agent-container/skills/`:
   ```
   skills/spring-boot-to-quarkus/SKILL.md
   ```
2. Rebuild the agent container:
   ```bash
   cd agent-container
   docker build --platform linux/amd64 -t quay.io/yourorg/migration-agent:latest .
   docker push quay.io/yourorg/migration-agent:latest
   ```
3. The skill name in the UI maps to the directory name under `/skills/`

## Development

### Local iteration (fastest)
```bash
cd plugins/migration-intelligence
yarn start  # Dev server with hot reload
```

### Test with rhdh-local (Docker Compose)
See [deploy/local/](./deploy/local/)

### Deploy to cluster
```bash
./deploy/deploy.sh
```

## Key Decisions

- **No material-table** — replaced with plain MUI Tables (material-table has null ref bugs)
- **K8s as source of truth** — Migrations page queries PipelineRuns directly, not just DB
- **Mock-free** — no fallback data; shows real empty states
- **Skills as files** — bundled in the container image, referenced by name
- **Goose v1.33.1** — Rust binary from Block, supports AWS Bedrock natively
