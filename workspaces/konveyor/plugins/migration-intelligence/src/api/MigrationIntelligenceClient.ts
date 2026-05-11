import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { MigrationIntelligenceApi } from './types';
import { AgentDefinition, PipelineDefinition, Migration } from './model';

export class MigrationIntelligenceClient implements MigrationIntelligenceApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async getBaseUrl(): Promise<string> {
    return await this.discoveryApi.getBaseUrl('migration-intelligence');
  }

  async getAgents(): Promise<AgentDefinition[]> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(`${baseUrl}/agents`);
    if (!response.ok) throw new Error(`Failed to fetch agents: ${response.statusText}`);
    return response.json();
  }

  async createAgent(agent: Omit<AgentDefinition, 'id'>): Promise<AgentDefinition> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(`${baseUrl}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    });
    if (!response.ok) throw new Error(`Failed to create agent: ${response.statusText}`);
    return response.json();
  }

  async getPipelines(): Promise<PipelineDefinition[]> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(`${baseUrl}/pipelines`);
    if (!response.ok) throw new Error(`Failed to fetch pipelines: ${response.statusText}`);
    return response.json();
  }

  async createPipeline(pipeline: Omit<PipelineDefinition, 'id'>): Promise<PipelineDefinition> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(`${baseUrl}/pipelines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pipeline),
    });
    if (!response.ok) throw new Error(`Failed to create pipeline: ${response.statusText}`);
    return response.json();
  }

  async getMigrations(): Promise<Migration[]> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(`${baseUrl}/migrations`);
    if (!response.ok) throw new Error(`Failed to fetch migrations: ${response.statusText}`);
    return response.json();
  }

  async getMigration(id: string): Promise<Migration> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(`${baseUrl}/migrations/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch migration: ${response.statusText}`);
    return response.json();
  }

  async startMigration(params: { applicationName: string; sourceRepo: string; skill: string; pipelineId?: string }): Promise<Migration> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(`${baseUrl}/migrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!response.ok) throw new Error(`Failed to start migration: ${response.statusText}`);
    return response.json();
  }
}
