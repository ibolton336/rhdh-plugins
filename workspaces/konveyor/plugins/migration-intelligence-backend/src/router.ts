/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LoggerService } from '@backstage/backend-plugin-api';
import { InputError, NotFoundError } from '@backstage/errors';
import { Router } from 'express';

import { DatabaseService } from './service/DatabaseService';
import { KubernetesService } from './service/KubernetesService';
import {
  CreateAgentRequest,
  CreatePipelineRequest,
  StartMigrationRequest,
} from './types';

export interface RouterOptions {
  logger: LoggerService;
  databaseService: DatabaseService;
  kubernetesService: KubernetesService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<Router> {
  const { logger, databaseService, kubernetesService } = options;
  const router = Router();

  router.use((await import('express')).json());

  // Health check
  router.get('/health', (_, res) => {
    res.json({ status: 'ok' });
  });

  // --- Agents ---

  router.get('/agents', async (_req, res) => {
    try {
      const agents = await databaseService.listAgents();
      res.json(agents);
    } catch (err) {
      logger.error(`Failed to list agents: ${err}`);
      res.status(500).json({ error: 'Failed to list agents' });
    }
  });

  router.post('/agents', async (req, res) => {
    try {
      const body = req.body as CreateAgentRequest;
      if (!body.name || !body.description || !body.image) {
        throw new InputError('name, description, and image are required');
      }
      const agent = await databaseService.createAgent(body);
      res.status(201).json(agent);
    } catch (err) {
      if (err instanceof InputError) {
        res.status(400).json({ error: err.message });
      } else {
        logger.error(`Failed to create agent: ${err}`);
        res.status(500).json({ error: 'Failed to create agent' });
      }
    }
  });

  // --- Pipelines ---

  router.get('/pipelines', async (_req, res) => {
    try {
      const pipelines = await databaseService.listPipelines();
      res.json(pipelines);
    } catch (err) {
      logger.error(`Failed to list pipelines: ${err}`);
      res.status(500).json({ error: 'Failed to list pipelines' });
    }
  });

  router.post('/pipelines', async (req, res) => {
    try {
      const body = req.body as CreatePipelineRequest;
      if (!body.name || !body.description || !body.tektonPipelineRef) {
        throw new InputError(
          'name, description, and tektonPipelineRef are required',
        );
      }
      const pipeline = await databaseService.createPipeline(body);
      res.status(201).json(pipeline);
    } catch (err) {
      if (err instanceof InputError) {
        res.status(400).json({ error: err.message });
      } else {
        logger.error(`Failed to create pipeline: ${err}`);
        res.status(500).json({ error: 'Failed to create pipeline' });
      }
    }
  });

  // --- Migrations ---

  router.get('/migrations', async (_req, res) => {
    try {
      const migrations = await databaseService.listMigrations();
      // Update status from K8s for running migrations
      const updated = await Promise.all(
        migrations.map(async m => {
          if (m.status === 'pending' || m.status === 'running') {
            try {
              const status = await kubernetesService.getPipelineRunStatus(
                m.pipelineRunName,
                m.namespace,
              );
              if (status.status !== m.status) {
                await databaseService.updateMigrationStatus(
                  m.id,
                  status.status,
                  status.completionTime,
                );
                return { ...m, status: status.status };
              }
            } catch {
              // Keep existing status on error
            }
          }
          return m;
        }),
      );
      res.json(updated);
    } catch (err) {
      logger.error(`Failed to list migrations: ${err}`);
      res.status(500).json({ error: 'Failed to list migrations' });
    }
  });

  router.post('/migrations', async (req, res) => {
    try {
      const body = req.body as StartMigrationRequest;
      if (!body.name || !body.pipelineDefinitionId) {
        throw new InputError('name and pipelineDefinitionId are required');
      }

      const pipeline = await databaseService.getPipelineById(
        body.pipelineDefinitionId,
      );
      if (!pipeline) {
        throw new NotFoundError(
          `Pipeline definition ${body.pipelineDefinitionId} not found`,
        );
      }

      const namespace = body.namespace ?? 'default';
      const pipelineRunName = `${body.name}-${Date.now()}`;

      await kubernetesService.createPipelineRun({
        name: pipelineRunName,
        namespace,
        pipelineRef: pipeline.tektonPipelineRef,
        params: body.params ?? {},
      });

      const migration = await databaseService.createMigration(
        body,
        pipelineRunName,
        namespace,
      );

      res.status(201).json(migration);
    } catch (err) {
      if (err instanceof InputError || err instanceof NotFoundError) {
        const status = err instanceof NotFoundError ? 404 : 400;
        res.status(status).json({ error: err.message });
      } else {
        logger.error(`Failed to start migration: ${err}`);
        res.status(500).json({ error: 'Failed to start migration' });
      }
    }
  });

  router.get('/migrations/:id', async (req, res) => {
    try {
      const migration = await databaseService.getMigrationById(req.params.id);
      if (!migration) {
        throw new NotFoundError(`Migration ${req.params.id} not found`);
      }

      // Refresh status from K8s
      if (migration.status === 'pending' || migration.status === 'running') {
        try {
          const status = await kubernetesService.getPipelineRunStatus(
            migration.pipelineRunName,
            migration.namespace,
          );
          if (status.status !== migration.status) {
            await databaseService.updateMigrationStatus(
              migration.id,
              status.status,
              status.completionTime,
            );
            migration.status = status.status;
            migration.completedAt = status.completionTime;
          }
        } catch {
          // Keep existing status
        }
      }

      // Get logs
      const logs = await kubernetesService.getPipelineRunLogs(
        migration.pipelineRunName,
        migration.namespace,
      );
      migration.logs = logs;

      res.json(migration);
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
      } else {
        logger.error(`Failed to get migration: ${err}`);
        res.status(500).json({ error: 'Failed to get migration' });
      }
    }
  });

  return router;
}
