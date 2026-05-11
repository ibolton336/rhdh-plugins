import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef, agentDefinitionsRouteRef, pipelineDefinitionsRouteRef, migrationsRouteRef } from './routes';
import { migrationIntelligenceApiRef } from './api';
import { MigrationIntelligenceClient } from './api/MigrationIntelligenceClient';

const pluginId = 'migration-intelligence';

export const migrationIntelligencePlugin = createPlugin({
  id: pluginId,
  routes: {
    root: rootRouteRef,
    agentDefinitions: agentDefinitionsRouteRef,
    pipelineDefinitions: pipelineDefinitionsRouteRef,
    migrations: migrationsRouteRef,
  },
  apis: [
    createApiFactory({
      api: migrationIntelligenceApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new MigrationIntelligenceClient({ discoveryApi, fetchApi }),
    }),
  ],
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

export const MigrationsPage = migrationIntelligencePlugin.provide(
  createRoutableExtension({
    name: 'MigrationsPage',
    component: () =>
      import('./components/MigrationsPage').then(
        m => m.MigrationsPage,
      ),
    mountPoint: migrationsRouteRef,
  }),
);
