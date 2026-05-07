import { createDevApp } from '@backstage/dev-utils';
import {
  migrationIntelligencePlugin,
  MigrationIntelligencePage,
  AgentDefinitionsPage,
  PipelineDefinitionsPage,
} from '../src';

createDevApp()
  .registerPlugin(migrationIntelligencePlugin)
  .addPage({
    element: <MigrationIntelligencePage />,
    title: 'Migration Intelligence',
    path: '/migration-intelligence',
  })
  .addPage({
    element: <AgentDefinitionsPage />,
    title: 'Agent Definitions',
    path: '/migration-intelligence/agent-definitions',
  })
  .addPage({
    element: <PipelineDefinitionsPage />,
    title: 'Pipeline Definitions',
    path: '/migration-intelligence/pipeline-definitions',
  })
  .render();
