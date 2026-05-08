import {
  Header,
  Page,
  Content,
  ContentHeader,
  StatusOK,
  StatusWarning,
  InfoCard,
  Progress,
} from '@backstage/core-components';
import {
  Chip,
  Typography,
  Box,
  Grid,
  Stepper,
  Step,
  StepLabel,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';

import { PipelineDefinition } from './mockData';
import { usePipelineDefinitions } from '../../hooks/useApi';

function PipelineCard({ pipeline }: { pipeline: PipelineDefinition }) {
  return (
    <InfoCard
      title={pipeline.name}
      subheader={pipeline.description}
      action={
        pipeline.status === 'active' ? (
          <StatusOK>Active</StatusOK>
        ) : (
          <StatusWarning>Draft</StatusWarning>
        )
      }
    >
      <Stepper alternativeLabel>
        {pipeline.steps.map(step => (
          <Step key={step.order} active>
            <StepLabel>
              <Typography variant="body2" style={{ fontWeight: 600 }}>
                {step.agentName}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {step.description}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      <Box mt={1} display="flex" style={{ gap: 8 }}>
        <Chip label={`${pipeline.steps.length} steps`} size="small" variant="outlined" />
        <Chip label={pipeline.status} size="small" color={pipeline.status === 'active' ? 'primary' : 'default'} />
      </Box>
    </InfoCard>
  );
}

export const PipelineDefinitionsPage = () => {
  const { pipelines, loading, error } = usePipelineDefinitions();

  if (loading) return <Progress />;

  return (
    <Page themeId="tool">
      <Header
        title="Pipeline Definitions"
        subtitle="Define migration pipelines as sequences of agent tasks"
      />
      <Content>
        <ContentHeader title="Pipelines" />
        {error && (
          <Alert severity="warning" style={{ marginBottom: 16 }}>
            Using mock data — backend unavailable
          </Alert>
        )}
        <Grid container spacing={3}>
          {pipelines.map(pipeline => (
            <Grid item xs={12} key={pipeline.id}>
              <PipelineCard pipeline={pipeline} />
            </Grid>
          ))}
        </Grid>
      </Content>
    </Page>
  );
};

export { PipelineDefinitionsPage as PipelineDefinitionsContent };
