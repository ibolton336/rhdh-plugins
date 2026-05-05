# @red-hat-developer-hub/backstage-plugin-x2a-node

## 0.2.3

### Patch Changes

- daaea27: Changed the project to be source-technology agnostic. Rephrasing all texts from being Chef-oriented to more generic variants. There is explicit mapping from free-form agentic findings to the new SourceTechnology enum (normalizeSourceTechnology.ts).
- Updated dependencies [daaea27]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.2.2

## 0.2.2

### Patch Changes

- f45644b: Internal change only - split x2a-node services.ts for better maintenance in the future.

## 0.2.1

### Patch Changes

- 484583b: Added x2a-list-modules MCP tool listing modules by projectId.

## 0.2.0

### Minor Changes

- ff39f9a: Add x2a-mcp-extras backend plugin exposing MCP tools for AI clients, x2a-dcr frontend plugin for RHDH 1.9 DCR OAuth consent flow, and x2a-node shared node-library. Refactor x2a-backend to use shared service refs from x2a-node via a feature loader.

### Patch Changes

- Updated dependencies [ff39f9a]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.2.1
