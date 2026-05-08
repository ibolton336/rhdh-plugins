import {
  Header,
  Page,
  TabbedLayout,
} from '@backstage/core-components';

import { MigrationDashboardContent } from './MigrationDashboardContent';
import { AgentDefinitionsContent } from '../AgentDefinitionsPage/AgentDefinitionsPage';
import { PipelineDefinitionsContent } from '../PipelineDefinitionsPage/PipelineDefinitionsPage';

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
      </TabbedLayout>
    </Page>
  );
};
