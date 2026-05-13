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
import * as k8s from '@kubernetes/client-node';

import { MigrationStatus } from '../types';

export interface PipelineRunSpec {
  name: string;
  namespace: string;
  pipelineRef: string;
  params: Record<string, string>;
}

export interface PipelineRunStatus {
  name: string;
  status: MigrationStatus;
  completionTime?: string;
  taskRuns?: Array<{ name: string; status: string }>;
}

export interface StartMigrationParams {
  applicationName: string;
  sourceRepo: string;
  skill: string;
  sourceBranch?: string;
  llmProvider?: string;
  githubToken?: string;
}

export class KubernetesService {
  private client: k8s.CustomObjectsApi | undefined;
  private coreClient: k8s.CoreV1Api | undefined;
  private inCluster: boolean;

  private static readonly NAMESPACE = 'rhdh';
  private static readonly PIPELINE_NAME = 'full-migration-pipeline';

  constructor(private readonly logger: LoggerService) {
    this.inCluster = !!process.env.KUBERNETES_SERVICE_HOST;

    if (this.inCluster) {
      try {
        const kc = new k8s.KubeConfig();
        kc.loadFromCluster();
        this.client = kc.makeApiClient(k8s.CustomObjectsApi);
        this.coreClient = kc.makeApiClient(k8s.CoreV1Api);
        this.logger.info('KubernetesService initialized with in-cluster config');
      } catch (err) {
        this.logger.warn(
          `Failed to initialize Kubernetes client: ${err}. Using mock mode.`,
        );
        this.inCluster = false;
      }
    } else {
      this.logger.warn(
        'Not running in a Kubernetes cluster. KubernetesService will return mock data.',
      );
    }
  }

  async startMigration(params: StartMigrationParams): Promise<string> {
    const timestamp = Date.now();
    const sanitizedName = params.applicationName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .substring(0, 40);
    const pipelineRunName = `migration-${sanitizedName}-${timestamp}`;
    const targetBranch = `migration-${timestamp}`;

    if (!this.inCluster || !this.client) {
      this.logger.info(
        `[MOCK] Creating PipelineRun: ${pipelineRunName} for app ${params.applicationName}`,
      );
      return pipelineRunName;
    }

    const pipelineRun = {
      apiVersion: 'tekton.dev/v1',
      kind: 'PipelineRun',
      metadata: {
        name: pipelineRunName,
        namespace: KubernetesService.NAMESPACE,
        labels: {
          'migration-intelligence/app': sanitizedName,
          'tekton.dev/pipeline': KubernetesService.PIPELINE_NAME,
        },
      },
      spec: {
        pipelineRef: {
          name: KubernetesService.PIPELINE_NAME,
        },
        params: [
          { name: 'source-repo', value: params.sourceRepo },
          { name: 'source-branch', value: params.sourceBranch ?? 'main' },
          { name: 'target-branch', value: targetBranch },
          { name: 'skill', value: params.skill },
          { name: 'llm-provider', value: params.llmProvider ?? 'openai' },
          { name: 'github-token', value: params.githubToken || '' },
        ],
        workspaces: [
          {
            name: 'shared-workspace',
            volumeClaimTemplate: {
              spec: {
                accessModes: ['ReadWriteOnce'],
                resources: {
                  requests: {
                    storage: '1Gi',
                  },
                },
              },
            },
          },
        ],
      },
    };

    this.logger.info(
      `Creating PipelineRun ${pipelineRunName} in namespace ${KubernetesService.NAMESPACE}`,
    );

    await this.client.createNamespacedCustomObject({
      group: 'tekton.dev',
      version: 'v1',
      namespace: KubernetesService.NAMESPACE,
      plural: 'pipelineruns',
      body: pipelineRun,
    });

    return pipelineRunName;
  }

  async createPipelineRun(spec: PipelineRunSpec): Promise<string> {
    if (!this.inCluster || !this.client) {
      this.logger.info(`[MOCK] Creating PipelineRun: ${spec.name}`);
      return spec.name;
    }

    const pipelineRun = {
      apiVersion: 'tekton.dev/v1',
      kind: 'PipelineRun',
      metadata: {
        name: spec.name,
        namespace: spec.namespace,
      },
      spec: {
        pipelineRef: {
          name: spec.pipelineRef,
        },
        params: Object.entries(spec.params).map(([name, value]) => ({
          name,
          value,
        })),
        workspaces: [
          {
            name: 'shared-workspace',
            volumeClaimTemplate: {
              spec: {
                accessModes: ['ReadWriteOnce'],
                resources: {
                  requests: {
                    storage: '1Gi',
                  },
                },
              },
            },
          },
        ],
      },
    };

    await this.client.createNamespacedCustomObject({
      group: 'tekton.dev',
      version: 'v1',
      namespace: spec.namespace,
      plural: 'pipelineruns',
      body: pipelineRun,
    });

    return spec.name;
  }

  async getPipelineRunStatus(
    name: string,
    namespace: string,
  ): Promise<PipelineRunStatus> {
    if (!this.inCluster || !this.client) {
      this.logger.info(`[MOCK] Getting PipelineRun status: ${name}`);
      return { name, status: 'running', taskRuns: [] };
    }

    const response = await this.client.getNamespacedCustomObject({
      group: 'tekton.dev',
      version: 'v1',
      namespace,
      plural: 'pipelineruns',
      name,
    });

    const obj = response as Record<string, unknown>;
    const statusObj = obj.status as Record<string, unknown> | undefined;
    const conditions =
      (statusObj?.conditions as Array<Record<string, string>>) ?? [];
    const condition = conditions.find(c => c.type === 'Succeeded');

    let status: MigrationStatus = 'pending';
    if (condition) {
      if (condition.status === 'True') status = 'succeeded';
      else if (condition.status === 'False') status = 'failed';
      else status = 'running';
    }

    // Extract TaskRun references
    const childReferences =
      (statusObj?.childReferences as Array<Record<string, string>>) ?? [];
    const taskRuns = childReferences
      .filter(ref => ref.kind === 'TaskRun')
      .map(ref => ({
        name: ref.name,
        status: ref.pipelineTaskName ?? 'unknown',
      }));

    return {
      name,
      status,
      completionTime: statusObj?.completionTime as string | undefined,
      taskRuns,
    };
  }

  async getPipelineRunLogs(name: string, namespace: string): Promise<string> {
    if (!this.inCluster || !this.coreClient) {
      this.logger.info(`[MOCK] Getting logs for PipelineRun: ${name}`);
      return `[Mock logs for PipelineRun ${name} in ${namespace}]`;
    }

    try {
      const pods = await this.coreClient.listNamespacedPod({
        namespace,
        labelSelector: `tekton.dev/pipelineRun=${name}`,
      });

      const logs: string[] = [];
      for (const pod of pods.items) {
        const podName = pod.metadata?.name;
        if (!podName) continue;

        for (const container of pod.spec?.containers ?? []) {
          try {
            const log = await this.coreClient.readNamespacedPodLog({
              name: podName,
              namespace,
              container: container.name,
            });
            logs.push(`--- ${podName}/${container.name} ---\n${log}`);
          } catch {
            logs.push(
              `--- ${podName}/${container.name} --- [no logs available]`,
            );
          }
        }
      }

      return logs.join('\n\n');
    } catch (err) {
      this.logger.error(`Failed to get logs for PipelineRun ${name}: ${err}`);
      return `[Error fetching logs: ${err}]`;
    }
  }

  async listPipelineRuns(namespace?: string): Promise<any[]> {
    const ns = namespace || KubernetesService.NAMESPACE;

    if (!this.inCluster || !this.client) {
      return [];
    }

    try {
      const response = await this.client.listNamespacedCustomObject({
        group: 'tekton.dev',
        version: 'v1',
        namespace: ns,
        plural: 'pipelineruns',
        labelSelector: 'tekton.dev/pipeline=full-migration-pipeline',
      });

      const items = (response as any)?.items || [];
      return items.map((item: any) => {
        const conditions = item.status?.conditions || [];
        const succeeded = conditions.find((c: any) => c.type === 'Succeeded');
        let status: MigrationStatus = 'pending';
        if (succeeded) {
          if (succeeded.status === 'True') status = 'succeeded';
          else if (succeeded.status === 'False') status = 'failed';
          else status = 'running';
        } else if (item.status?.startTime) {
          status = 'running';
        }

        return {
          id: item.metadata.name,
          pipelineRunName: item.metadata.name,
          applicationName: item.metadata.labels?.['migration-intelligence/app'] || 'unknown',
          status,
          startedAt: item.status?.startTime || item.metadata.creationTimestamp,
          completedAt: item.status?.completionTime || undefined,
        };
      });
    } catch (err) {
      this.logger.error(`Failed to list PipelineRuns: ${err}`);
      return [];
    }
  }
}
