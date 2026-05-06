# @red-hat-developer-hub/backstage-plugin-migration-intelligence

Frontend plugin for **Migration Intelligence** in Red Hat Developer Hub.

Provides a dashboard page at `/migration-intelligence` for visualizing and managing application migrations (Java EE → Quarkus, Spring Boot → Quarkus, etc.) powered by the Konveyor ecosystem.

## Features

- **Application Portfolio** — Table view of applications with migration status, progress bars, complexity indicators
- **Available Migrators** — Cards showing AI agents, manual workflows, and hybrid options
- **Start Migration Wizard** — 3-step dialog: select app → choose migrator → review & launch

## Installation

```bash
yarn --cwd workspaces/migration-intelligence add @red-hat-developer-hub/backstage-plugin-migration-intelligence
```

## Dynamic Plugin Configuration

Add to your RHDH `dynamic-plugins` ConfigMap:

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-migration-intelligence:
      appIcons:
        - name: migrationIcon
          importName: MigrationIcon
      dynamicRoutes:
        - path: /migration-intelligence
          importName: MigrationIntelligencePage
          menuItem:
            text: 'Migration Intelligence'
            icon: migrationIcon
```

## Development

```bash
cd workspaces/migration-intelligence
yarn install
cd plugins/migration-intelligence
yarn start
```

## License

Apache-2.0
