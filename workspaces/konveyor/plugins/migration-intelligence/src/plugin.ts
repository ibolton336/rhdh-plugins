import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef, agentDefinitionsRouteRef, pipelineDefinitionsRouteRef } from './routes';

const pluginId = 'migration-intelligence';

export const migrationIntelligencePlugin = createPlugin({
  id: pluginId,
  routes: {
    root: rootRouteRef,
    agentDefinitions: agentDefinitionsRouteRef,
    pipelineDefinitions: pipelineDefinitionsRouteRef,
  },
});

export const MigrationIntelligencePage = migrationIntelligencePlugin.provide(
  createRoutableExtension({
    name: 'MigrationIntelligencePage',
    component: () =>
      import('./components/MigrationDashboardPage').then(
        m => m.MigrationDashboardPage,
      ),
    mountPoint: rootRouteRef,
  }),
);

export const AgentDefinitionsPage = migrationIntelligencePlugin.provide(
  createRoutableExtension({
    name: 'AgentDefinitionsPage',
    component: () =>
      import('./components/AgentDefinitionsPage').then(
        m => m.AgentDefinitionsPage,
      ),
    mountPoint: agentDefinitionsRouteRef,
  }),
);

export const PipelineDefinitionsPage = migrationIntelligencePlugin.provide(
  createRoutableExtension({
    name: 'PipelineDefinitionsPage',
    component: () =>
      import('./components/PipelineDefinitionsPage').then(
        m => m.PipelineDefinitionsPage,
      ),
    mountPoint: pipelineDefinitionsRouteRef,
  }),
);
