import {
  Header,
  Page,
  TabbedLayout,
} from '@backstage/core-components';

import { MigrationDashboardContent } from './MigrationDashboardContent';
import { AgentDefinitionsContent } from '../AgentDefinitionsPage/AgentDefinitionsPage';
import { PipelineDefinitionsContent } from '../PipelineDefinitionsPage/PipelineDefinitionsPage';
import { MigrationsContent } from '../MigrationsPage';

export const MigrationDashboardPage = () => {
  return (
    <Page themeId="tool">
      <Header
        title="Migration Intelligence"
        subtitle="Manage and monitor application migrations to modern runtimes"
      />
      <TabbedLayout>
        <TabbedLayout.Route path="/" title="Dashboard">
          <MigrationDashboardContent />
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/agents" title="Agent Definitions">
          <AgentDefinitionsContent />
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/pipelines" title="Pipeline Definitions">
          <PipelineDefinitionsContent />
        </TabbedLayout.Route>
        <TabbedLayout.Route path="/migrations" title="Migrations">
          <MigrationsContent />
        </TabbedLayout.Route>
      </TabbedLayout>
    </Page>
  );
};
