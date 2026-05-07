import { createRouteRef } from '@backstage/core-plugin-api';

export const rootRouteRef = createRouteRef({
  id: 'migration-intelligence',
});

export const agentDefinitionsRouteRef = createRouteRef({
  id: 'migration-intelligence/agent-definitions',
});

export const pipelineDefinitionsRouteRef = createRouteRef({
  id: 'migration-intelligence/pipeline-definitions',
});
