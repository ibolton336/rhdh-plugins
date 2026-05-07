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
}

export class KubernetesService {
  private client: k8s.CustomObjectsApi | undefined;
  private coreClient: k8s.CoreV1Api | undefined;
  private inCluster: boolean;

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
      return { name, status: 'running' };
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
    const conditions = (statusObj?.conditions as Array<Record<string, string>>) ?? [];
    const condition = conditions.find(c => c.type === 'Succeeded');

    let status: MigrationStatus = 'pending';
    if (condition) {
      if (condition.status === 'True') status = 'succeeded';
      else if (condition.status === 'False') status = 'failed';
      else status = 'running';
    }

    return {
      name,
      status,
      completionTime: statusObj?.completionTime as string | undefined,
    };
  }

  async getPipelineRunLogs(
    name: string,
    namespace: string,
  ): Promise<string> {
    if (!this.inCluster || !this.coreClient) {
      this.logger.info(`[MOCK] Getting logs for PipelineRun: ${name}`);
      return `[Mock logs for PipelineRun ${name} in ${namespace}]`;
    }

    try {
      // List pods associated with the PipelineRun
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
            logs.push(`--- ${podName}/${container.name} --- [no logs available]`);
          }
        }
      }

      return logs.join('\n\n');
    } catch (err) {
      this.logger.error(`Failed to get logs for PipelineRun ${name}: ${err}`);
      return `[Error fetching logs: ${err}]`;
    }
  }
}
