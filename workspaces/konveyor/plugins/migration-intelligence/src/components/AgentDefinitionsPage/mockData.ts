export type AgentStatus = 'active' | 'draft';

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  llmProvider: string;
  llmEndpoint: string;
  skill: string;
  rules: string[];
  sourceTechnologies: string[];
  targetTechnologies: string[];
  status: AgentStatus;
}

export const mockAgentDefinitions: AgentDefinition[] = [
  {
    id: 'agent-1',
    name: 'java-ee-to-quarkus',
    description: 'Migrates Java EE applications to Quarkus using AI-assisted code transformation',
    llmProvider: 'granite-3.3-8b',
    llmEndpoint: 'https://inference.example.com/v1',
    skill: 'konveyor/java-ee-to-quarkus.md',
    rules: ['jakarta-ee', 'cdi-to-quarkus', 'jpa-to-panache'],
    sourceTechnologies: ['Java EE 7', 'Java EE 8'],
    targetTechnologies: ['Quarkus 3.x'],
    status: 'active',
  },
  {
    id: 'agent-2',
    name: 'spring-boot-to-quarkus',
    description: 'Converts Spring Boot microservices to Quarkus with Spring compatibility layer',
    llmProvider: 'granite-3.3-8b',
    llmEndpoint: 'https://inference.example.com/v1',
    skill: 'konveyor/spring-boot-to-quarkus.md',
    rules: ['spring-di-to-cdi', 'spring-web-to-resteasy', 'spring-data-to-panache'],
    sourceTechnologies: ['Spring Boot 2.x', 'Spring Boot 3.x'],
    targetTechnologies: ['Quarkus 3.x'],
    status: 'active',
  },
  {
    id: 'agent-3',
    name: 'dotnet-to-containerized',
    description: 'Containerizes .NET Framework applications for OpenShift deployment',
    llmProvider: 'llama-3.1-70b',
    llmEndpoint: 'https://inference.example.com/v1',
    skill: 'konveyor/dotnet-containerize.md',
    rules: ['windows-to-linux', 'iis-to-kestrel', 'config-to-env'],
    sourceTechnologies: ['.NET Framework 4.x'],
    targetTechnologies: ['.NET 8 (Linux container)'],
    status: 'active',
  },
  {
    id: 'agent-4',
    name: 'eap7-to-eap8',
    description: 'Upgrades JBoss EAP 7 applications to EAP 8 with Jakarta namespace migration',
    llmProvider: 'granite-3.3-8b',
    llmEndpoint: 'https://inference.example.com/v1',
    skill: 'konveyor/eap7-to-eap8.md',
    rules: ['javax-to-jakarta', 'eap7-deprecated-apis'],
    sourceTechnologies: ['JBoss EAP 7'],
    targetTechnologies: ['JBoss EAP 8'],
    status: 'draft',
  },
];

export const availableLLMProviders = [
  'granite-3.3-8b',
  'llama-3.1-70b',
  'mistral-7b',
  'gpt-4o',
];

export const availableRules = [
  'jakarta-ee',
  'cdi-to-quarkus',
  'jpa-to-panache',
  'spring-di-to-cdi',
  'spring-web-to-resteasy',
  'spring-data-to-panache',
  'windows-to-linux',
  'iis-to-kestrel',
  'config-to-env',
  'javax-to-jakarta',
  'eap7-deprecated-apis',
];
