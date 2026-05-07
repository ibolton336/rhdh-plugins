# Migration Intelligence Backend

Backend plugin for the Migration Intelligence feature in Red Hat Developer Hub.

## Overview

This plugin provides REST API endpoints to manage AI-powered migration workflows using Tekton Pipelines on Kubernetes.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/agents` | List agent definitions |
| POST | `/agents` | Create agent definition |
| GET | `/pipelines` | List pipeline definitions |
| POST | `/pipelines` | Create pipeline definition |
| POST | `/migrations` | Start a migration (creates Tekton PipelineRun) |
| GET | `/migrations` | List migrations with status |
| GET | `/migrations/:id` | Get migration status and logs |
| GET | `/health` | Health check |

## Installation

Add the plugin to your Backstage backend:

```typescript
// packages/backend/src/index.ts
backend.add(import('@red-hat-developer-hub/backstage-plugin-migration-intelligence-backend'));
```

## Configuration

The plugin uses in-cluster Kubernetes configuration when running inside a cluster.
When running outside a cluster, it operates in mock mode for development.

Database is automatically provisioned via Backstage's built-in database service.
