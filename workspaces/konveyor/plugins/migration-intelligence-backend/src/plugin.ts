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

import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';

import { createRouter } from './router';
import { DatabaseService } from './service/DatabaseService';
import { KubernetesService } from './service/KubernetesService';

/**
 * @public
 * The migration-intelligence backend plugin.
 */
export const migrationIntelligencePlugin = createBackendPlugin({
  pluginId: 'migration-intelligence',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        http: coreServices.httpRouter,
        database: coreServices.database,
      },
      async init({ logger, http, database }) {
        const databaseService = await DatabaseService.create(database);
        const kubernetesService = new KubernetesService(logger);

        http.use(
          await createRouter({
            logger,
            databaseService,
            kubernetesService,
          }),
        );

        http.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
