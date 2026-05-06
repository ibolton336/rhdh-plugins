/**
 * Mock data for the migration intelligence dashboard.
 * In production this comes from a backend plugin talking to Konveyor Hub.
 */

export type MigrationStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'failed';

export interface ApplicationMigration {
  id: string;
  name: string;
  description: string;
  sourceRepository: string;
  sourceTechnology: string;
  targetTechnology: string;
  status: MigrationStatus;
  complexity: 'low' | 'medium' | 'high';
  lastUpdated: string;
  migratorUsed?: string;
  progress?: number;
  issuesFound?: number;
  issuesResolved?: number;
}

export interface Migrator {
  id: string;
  name: string;
  description: string;
  type: 'ai-agent' | 'manual' | 'hybrid';
  supportedSources: string[];
  supportedTargets: string[];
  skill: string;
  status: 'available' | 'busy' | 'offline';
  successRate?: number;
  avgDuration?: string;
}

export const mockApplications: ApplicationMigration[] = [
  {
    id: 'app-1',
    name: 'coolstore',
    description: 'Java EE e-commerce app — EJBs, JMS, JSF',
    sourceRepository: 'https://github.com/konveyor-ecosystem/coolstore',
    sourceTechnology: 'Java EE 7',
    targetTechnology: 'Quarkus 3.8',
    status: 'in-progress',
    complexity: 'high',
    lastUpdated: '2026-05-06T10:30:00Z',
    migratorUsed: 'kai-migrator',
    progress: 45,
    issuesFound: 23,
    issuesResolved: 10,
  },
  {
    id: 'app-2',
    name: 'inventory-service',
    description: 'Spring Boot inventory microservice — JPA + REST',
    sourceRepository: 'https://github.com/konveyor-ecosystem/inventory-service',
    sourceTechnology: 'Spring Boot 2.7',
    targetTechnology: 'Quarkus 3.8',
    status: 'pending',
    complexity: 'medium',
    lastUpdated: '2026-05-05T16:00:00Z',
    issuesFound: 12,
    issuesResolved: 0,
  },
  {
    id: 'app-3',
    name: 'order-service',
    description: 'Java EE order processing — simple REST + CDI',
    sourceRepository: 'https://github.com/konveyor-ecosystem/order-service',
    sourceTechnology: 'Java EE 8',
    targetTechnology: 'Quarkus 3.8',
    status: 'completed',
    complexity: 'low',
    lastUpdated: '2026-04-28T14:30:00Z',
    migratorUsed: 'kai-migrator',
    progress: 100,
    issuesFound: 5,
    issuesResolved: 5,
  },
  {
    id: 'app-4',
    name: 'payment-gateway',
    description: 'Spring Boot payment service — complex transactions',
    sourceRepository: 'https://github.com/konveyor-ecosystem/payment-gateway',
    sourceTechnology: 'Spring Boot 2.5',
    targetTechnology: 'Quarkus 3.8',
    status: 'failed',
    complexity: 'high',
    lastUpdated: '2026-05-04T09:15:00Z',
    migratorUsed: 'kai-migrator',
    progress: 22,
    issuesFound: 31,
    issuesResolved: 7,
  },
  {
    id: 'app-5',
    name: 'notification-service',
    description: 'JMS-based notification dispatcher',
    sourceRepository: 'https://github.com/konveyor-ecosystem/notification-service',
    sourceTechnology: 'Java EE 7',
    targetTechnology: 'Quarkus 3.8',
    status: 'pending',
    complexity: 'medium',
    lastUpdated: '2026-05-06T08:00:00Z',
    issuesFound: 8,
    issuesResolved: 0,
  },
];

export const mockMigrators: Migrator[] = [
  {
    id: 'migrator-1',
    name: 'kai-migrator',
    description:
      'AI-powered migration agent — LLM + migration skills (tackle2-addon-kai)',
    type: 'ai-agent',
    supportedSources: [
      'Java EE 7',
      'Java EE 8',
      'Spring Boot 2.5',
      'Spring Boot 2.7',
    ],
    supportedTargets: ['Quarkus 3.8'],
    skill: 'java-ee-to-quarkus',
    status: 'available',
    successRate: 78,
    avgDuration: '~45 min',
  },
  {
    id: 'migrator-2',
    name: 'manual-workflow',
    description:
      'Guided manual migration — analysis report + step-by-step refactoring',
    type: 'manual',
    supportedSources: [
      'Java EE 7',
      'Java EE 8',
      'Spring Boot 2.5',
      'Spring Boot 2.7',
    ],
    supportedTargets: ['Quarkus 3.8'],
    skill: 'manual-migration-guide',
    status: 'available',
    successRate: 95,
    avgDuration: '~2-4 hours',
  },
  {
    id: 'migrator-3',
    name: 'hybrid-assist',
    description:
      'AI does heavy lifting, human reviews each transformation before applying',
    type: 'hybrid',
    supportedSources: ['Java EE 7', 'Java EE 8', 'Spring Boot 2.7'],
    supportedTargets: ['Quarkus 3.8'],
    skill: 'hybrid-migration-assist',
    status: 'busy',
    successRate: 91,
    avgDuration: '~1.5 hours',
  },
];
