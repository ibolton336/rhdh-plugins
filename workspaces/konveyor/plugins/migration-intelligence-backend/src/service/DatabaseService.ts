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

import { DatabaseService as BackstageDatabaseService } from '@backstage/backend-plugin-api';
import { Knex } from 'knex';

import {
  AgentDefinition,
  CreateAgentRequest,
  CreatePipelineRequest,
  Migration,
  MigrationStatus,
  PipelineDefinition,
  StartMigrationRequest,
} from '../types';

export class DatabaseService {
  private constructor(private readonly db: Knex) {}

  static async create(
    database: BackstageDatabaseService,
  ): Promise<DatabaseService> {
    const knex = await database.getClient();
    const service = new DatabaseService(knex);
    await service.migrate();
    return service;
  }

  private async migrate(): Promise<void> {
    if (!(await this.db.schema.hasTable('agent_definitions'))) {
      await this.db.schema.createTable('agent_definitions', table => {
        table.string('id').primary();
        table.string('name').notNullable();
        table.text('description').notNullable();
        table.string('image').notNullable();
        table.text('skills').notNullable(); // JSON array
        table.text('config').notNullable(); // JSON object
        table.timestamp('created_at').defaultTo(this.db.fn.now());
        table.timestamp('updated_at').defaultTo(this.db.fn.now());
      });
    }

    if (!(await this.db.schema.hasTable('pipeline_definitions'))) {
      await this.db.schema.createTable('pipeline_definitions', table => {
        table.string('id').primary();
        table.string('name').notNullable();
        table.text('description').notNullable();
        table.string('tekton_pipeline_ref').notNullable();
        table.text('params').notNullable(); // JSON array
        table.text('agent_ids').notNullable(); // JSON array
        table.timestamp('created_at').defaultTo(this.db.fn.now());
        table.timestamp('updated_at').defaultTo(this.db.fn.now());
      });
    }

    if (!(await this.db.schema.hasTable('migrations'))) {
      await this.db.schema.createTable('migrations', table => {
        table.string('id').primary();
        table.string('name').notNullable();
        table.string('pipeline_definition_id').notNullable();
        table.string('pipeline_run_name').notNullable();
        table.string('namespace').notNullable();
        table.string('status').notNullable();
        table.text('params').notNullable(); // JSON object
        table.timestamp('started_at').defaultTo(this.db.fn.now());
        table.timestamp('completed_at').nullable();
      });
    }
  }

  async listAgents(): Promise<AgentDefinition[]> {
    const rows = await this.db('agent_definitions').select('*');
    return rows.map(this.rowToAgent);
  }

  async createAgent(req: CreateAgentRequest): Promise<AgentDefinition> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db('agent_definitions').insert({
      id,
      name: req.name,
      description: req.description,
      image: req.image,
      skills: JSON.stringify(req.skills ?? []),
      config: JSON.stringify(req.config ?? {}),
      created_at: now,
      updated_at: now,
    });
    return this.rowToAgent({
      id,
      name: req.name,
      description: req.description,
      image: req.image,
      skills: JSON.stringify(req.skills ?? []),
      config: JSON.stringify(req.config ?? {}),
      created_at: now,
      updated_at: now,
    });
  }

  async listPipelines(): Promise<PipelineDefinition[]> {
    const rows = await this.db('pipeline_definitions').select('*');
    return rows.map(this.rowToPipeline);
  }

  async createPipeline(
    req: CreatePipelineRequest,
  ): Promise<PipelineDefinition> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db('pipeline_definitions').insert({
      id,
      name: req.name,
      description: req.description,
      tekton_pipeline_ref: req.tektonPipelineRef,
      params: JSON.stringify(req.params ?? []),
      agent_ids: JSON.stringify(req.agentIds ?? []),
      created_at: now,
      updated_at: now,
    });
    return this.rowToPipeline({
      id,
      name: req.name,
      description: req.description,
      tekton_pipeline_ref: req.tektonPipelineRef,
      params: JSON.stringify(req.params ?? []),
      agent_ids: JSON.stringify(req.agentIds ?? []),
      created_at: now,
      updated_at: now,
    });
  }

  async getPipelineById(id: string): Promise<PipelineDefinition | undefined> {
    const row = await this.db('pipeline_definitions').where({ id }).first();
    return row ? this.rowToPipeline(row) : undefined;
  }

  async listMigrations(): Promise<Migration[]> {
    const rows = await this.db('migrations').select('*');
    return rows.map(this.rowToMigration);
  }

  async getMigrationById(id: string): Promise<Migration | undefined> {
    const row = await this.db('migrations').where({ id }).first();
    return row ? this.rowToMigration(row) : undefined;
  }

  async createMigration(
    req: StartMigrationRequest,
    pipelineRunName: string,
    namespace: string,
  ): Promise<Migration> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db('migrations').insert({
      id,
      name: req.name,
      pipeline_definition_id: req.pipelineDefinitionId,
      pipeline_run_name: pipelineRunName,
      namespace,
      status: 'pending',
      params: JSON.stringify(req.params ?? {}),
      started_at: now,
    });
    return {
      id,
      name: req.name,
      pipelineDefinitionId: req.pipelineDefinitionId,
      pipelineRunName,
      namespace,
      status: 'pending',
      params: req.params ?? {},
      startedAt: now,
    };
  }

  async updateMigrationStatus(
    id: string,
    status: MigrationStatus,
    completedAt?: string,
  ): Promise<void> {
    const update: Record<string, unknown> = { status };
    if (completedAt) {
      update.completed_at = completedAt;
    }
    await this.db('migrations').where({ id }).update(update);
  }

  private rowToAgent(row: Record<string, unknown>): AgentDefinition {
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      image: row.image as string,
      skills: JSON.parse(row.skills as string),
      config: JSON.parse(row.config as string),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private rowToPipeline(row: Record<string, unknown>): PipelineDefinition {
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      tektonPipelineRef: row.tekton_pipeline_ref as string,
      params: JSON.parse(row.params as string),
      agentIds: JSON.parse(row.agent_ids as string),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private rowToMigration(row: Record<string, unknown>): Migration {
    return {
      id: row.id as string,
      name: row.name as string,
      pipelineDefinitionId: row.pipeline_definition_id as string,
      pipelineRunName: row.pipeline_run_name as string,
      namespace: row.namespace as string,
      status: row.status as MigrationStatus,
      params: JSON.parse(row.params as string),
      startedAt: row.started_at as string,
      completedAt: (row.completed_at as string) || undefined,
    };
  }
}
