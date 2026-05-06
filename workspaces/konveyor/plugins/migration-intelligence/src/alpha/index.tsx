import React from 'react';
import {
  createFrontendPlugin,
  PageBlueprint,
  NavItemBlueprint,
} from '@backstage/frontend-plugin-api';
import {
  convertLegacyRouteRef,
  convertLegacyRouteRefs,
  compatWrapper,
} from '@backstage/core-compat-api';
import { rootRouteRef } from './routes';
import { MigrationIcon } from './icons';

const migrationIntelligencePage = PageBlueprint.makeWithOverrides({
  factory(originalFactory, _) {
    return originalFactory({
      path: '/migration-intelligence',
      routeRef: convertLegacyRouteRef(rootRouteRef),
      loader: () =>
        import('./components/MigrationDashboardPage').then(m =>
          compatWrapper(<m.MigrationDashboardPage />),
        ),
    });
  },
});

const migrationIntelligenceNavItem = NavItemBlueprint.make({
  params: {
    routeRef: convertLegacyRouteRef(rootRouteRef),
    title: 'Migration Intelligence',
    icon: MigrationIcon,
  },
});

export default createFrontendPlugin({
  pluginId: 'migration-intelligence',
  info: { packageJson: () => import('../package.json') },
  extensions: [migrationIntelligencePage, migrationIntelligenceNavItem],
  routes: convertLegacyRouteRefs({
    root: rootRouteRef,
  }),
});
