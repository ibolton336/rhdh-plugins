import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Alert } from '@material-ui/lab';

import { ApplicationMigration } from '../MigrationDashboardPage/mockData';
import {
  mockPipelineDefinitions,
} from '../PipelineDefinitionsPage/mockData';
import { mockAgentDefinitions } from '../AgentDefinitionsPage/mockData';

const useStyles = makeStyles(theme => ({
  formControl: { margin: theme.spacing(2, 0), minWidth: '100%' },
  summary: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
  chip: { margin: theme.spacing(0.5) },
  pipelineStep: {
    padding: theme.spacing(1),
    margin: theme.spacing(0.5, 0),
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    paddingLeft: theme.spacing(2),
  },
}));

interface StartMigrationDialogProps {
  open: boolean;
  onClose: () => void;
  applications: ApplicationMigration[];
}

const steps = [
  'Select Application',
  'Choose Pipeline',
  'Configure & Review',
  'Start',
];

export const StartMigrationDialog = ({
  open,
  onClose,
  applications,
}: StartMigrationDialogProps) => {
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  const app = applications.find(a => a.id === selectedApp);
  const pipeline = mockPipelineDefinitions.find(
    p => p.id === selectedPipeline,
  );
  const activePipelines = mockPipelineDefinitions.filter(
    p => p.status === 'active',
  );
  const activeAgents = mockAgentDefinitions.filter(
    a => a.status === 'active',
  );

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      setSubmitted(true);
      setTimeout(() => handleClose(), 3000);
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleClose = () => {
    setActiveStep(0);
    setSelectedApp('');
    setSelectedPipeline('');
    setSubmitted(false);
    onClose();
  };

  const canProceed = () => {
    if (activeStep === 0) return !!selectedApp;
    if (activeStep === 1) return !!selectedPipeline;
    return true;
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              Select an application to migrate:
            </Typography>
            <FormControl variant="outlined" className={classes.formControl}>
              <InputLabel>Application</InputLabel>
              <Select
                value={selectedApp}
                onChange={e => setSelectedApp(e.target.value as string)}
                label="Application"
              >
                {applications.map(a => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name} — {a.sourceTechnology} → {a.targetTechnology}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {app && (
              <Paper variant="outlined" className={classes.summary}>
                <Typography variant="subtitle2">{app.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {app.description}
                </Typography>
                <Box mt={1}>
                  <Chip
                    label={app.sourceTechnology}
                    size="small"
                    className={classes.chip}
                  />
                  <Chip
                    label="→"
                    size="small"
                    variant="outlined"
                    className={classes.chip}
                  />
                  <Chip
                    label={app.targetTechnology}
                    size="small"
                    color="primary"
                    className={classes.chip}
                  />
                </Box>
              </Paper>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              Choose a migration pipeline:
            </Typography>
            <FormControl variant="outlined" className={classes.formControl}>
              <InputLabel>Pipeline</InputLabel>
              <Select
                value={selectedPipeline}
                onChange={e => setSelectedPipeline(e.target.value as string)}
                label="Pipeline"
              >
                {activePipelines.map(p => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} — {(p.steps || []).length} steps
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {pipeline && (
              <Paper variant="outlined" className={classes.summary}>
                <Typography variant="subtitle2">{pipeline.name}</Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {pipeline.description}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Pipeline steps:
                </Typography>
                {(pipeline.steps || []).map(step => (
                  <Paper
                    key={step.order}
                    variant="outlined"
                    className={classes.pipelineStep}
                  >
                    <Typography variant="body2">
                      <strong>{step.order}.</strong> {step.agentName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {step.description}
                    </Typography>
                  </Paper>
                ))}
              </Paper>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              Review configuration:
            </Typography>
            <Paper variant="outlined" className={classes.summary}>
              <Typography variant="subtitle2" gutterBottom>
                Migration Summary
              </Typography>
              <Typography variant="body2">
                <strong>Application:</strong> {app?.name}
              </Typography>
              <Typography variant="body2">
                <strong>Source:</strong> {app?.sourceTechnology}
              </Typography>
              <Typography variant="body2">
                <strong>Target:</strong> {app?.targetTechnology}
              </Typography>
              <Typography variant="body2">
                <strong>Repository:</strong> {app?.sourceRepository}
              </Typography>
              <Box mt={2}>
                <Typography variant="body2">
                  <strong>Pipeline:</strong> {pipeline?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Steps:</strong>{' '}
                  {pipeline?.steps?.map(s => s.agentName).join(' → ')}
                </Typography>
              </Box>
              <Box mt={2}>
                <Typography variant="caption" color="textSecondary">
                  Agents that will be used:
                </Typography>
                <Box mt={0.5}>
                  {activeAgents.slice(0, 2).map(agent => (
                    <Chip
                      key={agent.id}
                      label={`${agent.name} (${agent.llmProvider})`}
                      size="small"
                      className={classes.chip}
                    />
                  ))}
                </Box>
              </Box>
              <Box mt={2}>
                <Alert severity="info">
                  This will create a Tekton PipelineRun on the cluster. Each
                  step runs as a container with access to the configured
                  migration skill. The final step opens a PR with the migrated
                  code.
                </Alert>
              </Box>
            </Paper>
          </Box>
        );

      case 3:
        return submitted ? (
          <Alert severity="success">
            PipelineRun created! Migration of <strong>{app?.name}</strong> is
            now running. Pipeline: {pipeline?.name} (
            {pipeline?.steps?.map(s => s.agentName).join(' → ')}). You'll
            receive a PR link when complete.
          </Alert>
        ) : (
          <Box>
            <Typography variant="body1" gutterBottom>
              Ready to start the migration pipeline?
            </Typography>
            <Alert severity="warning">
              This will spin up {pipeline?.steps?.length || 0} agent container(s) on
              the cluster. Each agent will process the source code sequentially.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Start Migration</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box mt={2}>{renderStep()}</Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {activeStep > 0 && !submitted && (
          <Button onClick={handleBack}>Back</Button>
        )}
        {!submitted && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {activeStep === steps.length - 1 ? 'Create PipelineRun' : 'Next'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
