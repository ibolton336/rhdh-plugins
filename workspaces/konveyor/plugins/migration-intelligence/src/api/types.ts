import { createApiRef } from '@backstage/core-plugin-api';
import { AgentDefinition, PipelineDefinition, Migration } from './model';

export interface MigrationIntelligenceApi {
  getAgents(): Promise<AgentDefinition[]>;
  createAgent(agent: Omit<AgentDefinition, 'id'>): Promise<AgentDefinition>;
  getPipelines(): Promise<PipelineDefinition[]>;
  createPipeline(pipeline: Omit<PipelineDefinition, 'id'>): Promise<PipelineDefinition>;
  getMigrations(): Promise<Migration[]>;
  getMigration(id: string): Promise<Migration>;
  startMigration(params: {
    applicationId: string;
    pipelineId: string;
  }): Promise<Migration>;
}

export const migrationIntelligenceApiRef = createApiRef<MigrationIntelligenceApi>({
  id: 'plugin.migration-intelligence.api',
});
