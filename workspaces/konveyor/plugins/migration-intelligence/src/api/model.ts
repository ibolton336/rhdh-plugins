export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  llmProvider: string;
  llmEndpoint: string;
  skill: string;
  rules: string[];
  sourceTechnologies: string[];
  targetTechnologies: string[];
  status: 'active' | 'draft';
}

export interface PipelineStep {
  order: number;
  agentName: string;
  description: string;
}

export interface PipelineDefinition {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  status: 'active' | 'draft';
}

export interface Migration {
  id: string;
  applicationName: string;
  pipelineName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentStep?: string;
  prUrl?: string;
  startedAt: string;
  completedAt?: string;
}
