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
      // Get migrations from K8s PipelineRuns directly
      const k8sMigrations = await kubernetesService.listPipelineRuns();

      // Also get DB migrations and merge
      const dbMigrations = await databaseService.listMigrations();

      // Merge: K8s is source of truth, add any DB-only entries
      const k8sNames = new Set(k8sMigrations.map((m: any) => m.pipelineRunName));
      const dbOnly = dbMigrations.filter(m => !k8sNames.has(m.pipelineRunName));

      res.json([...k8sMigrations, ...dbOnly]);
    } catch (err) {
      logger.error(`Failed to list migrations: ${err}`);
      res.status(500).json({ error: 'Failed to list migrations' });
    }
  });

  router.post('/migrations', async (req, res) => {
    try {
      const body = req.body as {
        applicationName?: string;
        sourceRepo?: string;
        skill?: string;
        pipelineId?: string;
        githubToken?: string;
        // Legacy fields
        name?: string;
        pipelineDefinitionId?: string;
        namespace?: string;
        params?: Record<string, string>;
      };

      // New direct migration flow: applicationName + sourceRepo + skill
      if (body.applicationName && body.sourceRepo && body.skill) {
        const pipelineRunName = await kubernetesService.startMigration({
          applicationName: body.applicationName,
          sourceRepo: body.sourceRepo,
          skill: body.skill,
          githubToken: body.githubToken,
        });

        // Also persist to DB if pipelineId is provided
        if (body.pipelineId) {
          const migrationRequest: StartMigrationRequest = {
            name: body.applicationName,
            pipelineDefinitionId: body.pipelineId,
            namespace: 'rhdh',
            params: {
              'source-repo': body.sourceRepo,
              skill: body.skill,
            },
          };
          try {
            const migration = await databaseService.createMigration(
              migrationRequest,
              pipelineRunName,
              'rhdh',
            );
            res.status(201).json({
              migrationId: pipelineRunName,
              id: migration.id,
              pipelineRunName,
              status: 'pending',
            });
          } catch {
            // DB persistence failed but PipelineRun was created
            res.status(201).json({
              migrationId: pipelineRunName,
              pipelineRunName,
              status: 'pending',
            });
          }
        } else {
          res.status(201).json({
            migrationId: pipelineRunName,
            pipelineRunName,
            status: 'pending',
          });
        }
        return;
      }

      // Legacy flow: name + pipelineDefinitionId
      const legacyBody = body as StartMigrationRequest;
      if (!legacyBody.name || !legacyBody.pipelineDefinitionId) {
        throw new InputError(
          'Either (applicationName, sourceRepo, skill) or (name, pipelineDefinitionId) are required',
        );
      }

      const pipeline = await databaseService.getPipelineById(
        legacyBody.pipelineDefinitionId,
      );
      if (!pipeline) {
        throw new NotFoundError(
          `Pipeline definition ${legacyBody.pipelineDefinitionId} not found`,
        );
      }

      const namespace = legacyBody.namespace ?? 'default';
      const pipelineRunName = `${legacyBody.name}-${Date.now()}`;

      await kubernetesService.createPipelineRun({
        name: pipelineRunName,
        namespace,
        pipelineRef: pipeline.tektonPipelineRef,
        params: legacyBody.params ?? {},
      });

      const migration = await databaseService.createMigration(
        legacyBody,
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

  // Get migration status by PipelineRun name directly
  router.get('/migrations/status/:pipelineRunName', async (req, res) => {
    try {
      const status = await kubernetesService.getPipelineRunStatus(
        req.params.pipelineRunName,
        'rhdh',
      );
      res.json(status);
    } catch (err) {
      logger.error(`Failed to get migration status: ${err}`);
      res.status(500).json({ error: 'Failed to get migration status' });
    }
  });

  // Get migration logs by PipelineRun name directly
  router.get('/migrations/logs/:pipelineRunName', async (req, res) => {
    try {
      const logs = await kubernetesService.getPipelineRunLogs(
        req.params.pipelineRunName,
        'rhdh',
      );
      res.json({ logs });
    } catch (err) {
      logger.error(`Failed to get migration logs: ${err}`);
      res.status(500).json({ error: 'Failed to get migration logs' });
    }
  });

  return router;
}
