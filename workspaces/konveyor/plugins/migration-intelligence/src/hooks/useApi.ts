import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { migrationIntelligenceApiRef, AgentDefinition, PipelineDefinition, Migration } from '../api';

export function useAgentDefinitions() {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchedRef = useRef(false);

  let api: any;
  try {
    api = useApi(migrationIntelligenceApiRef);
  } catch {
    api = null;
  }

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    if (!api) {
      setAgents([]);
      setLoading(false);
      setError(new Error('Backend API not available'));
      return;
    }
    api.getAgents()
      .then((data: AgentDefinition[]) => { setAgents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err: Error) => {
        console.warn('Failed to fetch agents:', err.message);
        setAgents([]);
        setError(err);
        setLoading(false);
      });
  }, [api]);

  const createAgent = useCallback(async (agent: Omit<AgentDefinition, 'id'>) => {
    if (!api) throw new Error('Backend API not available');
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
  const fetchedRef = useRef(false);

  let api: any;
  try {
    api = useApi(migrationIntelligenceApiRef);
  } catch {
    api = null;
  }

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    if (!api) {
      setPipelines([]);
      setLoading(false);
      setError(new Error('Backend API not available'));
      return;
    }
    api.getPipelines()
      .then((data: PipelineDefinition[]) => { setPipelines(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err: Error) => {
        console.warn('Failed to fetch pipelines:', err.message);
        setPipelines([]);
        setError(err);
        setLoading(false);
      });
  }, [api]);

  const createPipeline = useCallback(async (pipeline: Omit<PipelineDefinition, 'id'>) => {
    if (!api) throw new Error('Backend API not available');
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
  const fetchedRef = useRef(false);

  let api: any;
  try {
    api = useApi(migrationIntelligenceApiRef);
  } catch {
    api = null;
  }

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    if (!api) {
      setMigrations([]);
      setLoading(false);
      return;
    }
    api.getMigrations()
      .then((data: Migration[]) => { setMigrations(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err: Error) => {
        console.warn('Failed to fetch migrations:', err.message);
        setMigrations([]);
        setError(err);
        setLoading(false);
      });
  }, [api]);

  return { migrations, loading, error };
}
