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

export const mockPipelineDefinitions: PipelineDefinition[] = [
  {
    id: 'pipeline-1',
    name: 'Full Migration Pipeline',
    description: 'End-to-end migration: analyze, transform, review, and submit PR',
    steps: [
      { order: 1, agentName: 'analyze', description: 'Static analysis and issue discovery' },
      { order: 2, agentName: 'migrate', description: 'AI-assisted code transformation' },
      { order: 3, agentName: 'review', description: 'Automated code review and validation' },
      { order: 4, agentName: 'submit-pr', description: 'Create pull request with changes' },
    ],
    status: 'active',
  },
  {
    id: 'pipeline-2',
    name: 'Analysis Only',
    description: 'Run analysis and generate migration report without making changes',
    steps: [
      { order: 1, agentName: 'analyze', description: 'Static analysis and issue discovery' },
      { order: 2, agentName: 'report', description: 'Generate migration readiness report' },
    ],
    status: 'active',
  },
  {
    id: 'pipeline-3',
    name: 'Migrate and Review',
    description: 'Transform code and run review, but hold PR submission for manual approval',
    steps: [
      { order: 1, agentName: 'migrate', description: 'AI-assisted code transformation' },
      { order: 2, agentName: 'review', description: 'Automated code review and validation' },
    ],
    status: 'draft',
  },
];
