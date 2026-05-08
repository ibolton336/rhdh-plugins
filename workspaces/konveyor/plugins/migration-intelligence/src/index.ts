export {
  migrationIntelligencePlugin,
  MigrationIntelligencePage,
  AgentDefinitionsPage,
  PipelineDefinitionsPage,
} from './plugin';
export { MigrationIcon } from './icons';
export { migrationIntelligenceApiRef } from './api';
export type { MigrationIntelligenceApi } from './api';

// Direct component re-exports for dynamic plugin resolution
export { AgentDefinitionsPage as AgentDefinitionsPageComponent } from './components/AgentDefinitionsPage';
export { PipelineDefinitionsPage as PipelineDefinitionsPageComponent } from './components/PipelineDefinitionsPage';
