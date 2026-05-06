import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

const pluginId = 'migration-intelligence';

export const migrationIntelligencePlugin = createPlugin({
  id: pluginId,
  routes: {
    root: rootRouteRef,
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
