import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import {
  migrationIntelligencePlugin,
  MigrationIntelligencePage,
} from '../src';

createDevApp()
  .registerPlugin(migrationIntelligencePlugin)
  .addPage({
    element: <MigrationIntelligencePage />,
    title: 'Migration Intelligence',
    path: '/migration-intelligence',
  })
  .render();
