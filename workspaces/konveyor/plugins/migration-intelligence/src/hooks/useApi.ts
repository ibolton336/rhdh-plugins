import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { migrationIntelligenceApiRef, AgentDefinition, PipelineDefinition, Migration } from '../api';
import { mockAgentDefinitions } from '../components/AgentDefinitionsPage/mockData';
import { mockPipelineDefinitions } from '../components/PipelineDefinitionsPage/mockData';

export function useAgentDefinitions() {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  let api: any;
  try {
    api = useApi(migrationIntelligenceApiRef);
  } catch {
    api = null;
  }

  useEffect(() => {
    if (!api) {
      setAgents(mockAgentDefinitions as any);
      setLoading(false);
      setError(new Error('No backend — using mock data'));
      return;
    }
    api.getAgents()
      .then((data: AgentDefinition[]) => { setAgents(data); setLoading(false); })
      .catch((err: Error) => {
        console.warn('Backend unavailable, using mock data:', err.message);
        setAgents(mockAgentDefinitions as any);
        setError(err);
        setLoading(false);
      });
  }, [api]);

  const createAgent = useCallback(async (agent: Omit<AgentDefinition, 'id'>) => {
    if (!api) {
      const newAgent = { ...agent, id: `agent-${Date.now()}` } as AgentDefinition;
      setAgents(prev => [...prev, newAgent]);
      return newAgent;
    }
    const created = await api.createAgent(agent);
    setAgents(prev => [...prev, created]);
    return created;
  }, [api]);

  return { agents, loading, error, createAgent };
}

export function usePipelineDefinitions() {
  const [pipelines, setPipelines] = useState<PipelineDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  let api: any;
  try {
    api = useApi(migrationIntelligenceApiRef);
  } catch {
    api = null;
  }

  useEffect(() => {
    if (!api) {
      setPipelines(mockPipelineDefinitions as any);
      setLoading(false);
      setError(new Error('No backend — using mock data'));
      return;
    }
    api.getPipelines()
      .then((data: PipelineDefinition[]) => { setPipelines(data); setLoading(false); })
      .catch((err: Error) => {
        console.warn('Backend unavailable, using mock data:', err.message);
        setPipelines(mockPipelineDefinitions as any);
        setError(err);
        setLoading(false);
      });
  }, [api]);

  const createPipeline = useCallback(async (pipeline: Omit<PipelineDefinition, 'id'>) => {
    if (!api) {
      const newPipeline = { ...pipeline, id: `pipeline-${Date.now()}` } as PipelineDefinition;
      setPipelines(prev => [...prev, newPipeline]);
      return newPipeline;
    }
    const created = await api.createPipeline(pipeline);
    setPipelines(prev => [...prev, created]);
    return created;
  }, [api]);

  return { pipelines, loading, error, createPipeline };
}

export function useMigrations() {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  let api: any;
  try {
    api = useApi(migrationIntelligenceApiRef);
  } catch {
    api = null;
  }

  useEffect(() => {
    if (!api) {
      setMigrations([]);
      setLoading(false);
      return;
    }
    api.getMigrations()
      .then((data: Migration[]) => { setMigrations(data); setLoading(false); })
      .catch((err: Error) => {
        console.warn('Backend unavailable:', err.message);
        setMigrations([]);
        setError(err);
        setLoading(false);
      });
  }, [api]);

  const startMigration = useCallback(async (applicationId: string, pipelineId: string) => {
    if (!api) {
      const mock: Migration = {
        id: `mig-${Date.now()}`,
        applicationName: applicationId,
        pipelineName: pipelineId,
        status: 'running',
        startedAt: new Date().toISOString(),
      };
      setMigrations(prev => [...prev, mock]);
      return mock;
    }
    const created = await api.startMigration({ applicationId, pipelineId });
    setMigrations(prev => [...prev, created]);
    return created;
  }, [api]);

  return { migrations, loading, error, startMigration };
}
