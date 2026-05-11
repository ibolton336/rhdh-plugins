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
  CircularProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Alert } from '@material-ui/lab';
import { useApi } from '@backstage/core-plugin-api';

import { ApplicationMigration } from '../MigrationDashboardPage/mockData';
import { migrationIntelligenceApiRef } from '../../api';

const useStyles = makeStyles(theme => ({
  formControl: { margin: theme.spacing(2, 0), minWidth: '100%' },
  summary: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
  chip: { margin: theme.spacing(0.5) },
}));

interface StartMigrationDialogProps {
  open: boolean;
  onClose: () => void;
  applications: ApplicationMigration[];
}

const availableSkills = [
  { id: 'java-ee-to-quarkus', name: 'Java EE → Quarkus', description: 'Migrates Java EE apps to Quarkus using AI-assisted transformation' },
  { id: 'spring-boot-to-quarkus', name: 'Spring Boot → Quarkus', description: 'Converts Spring Boot services to Quarkus with compatibility layer' },
];

const steps = [
  'Select Application',
  'Choose Skill',
  'Review & Start',
];

export const StartMigrationDialog = ({
  open,
  onClose,
  applications,
}: StartMigrationDialogProps) => {
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  let api: any;
  try {
    api = useApi(migrationIntelligenceApiRef);
  } catch {
    api = null;
  }

  const app = applications.find(a => a.id === selectedApp);
  const skill = availableSkills.find(s => s.id === selectedSkill);

  const handleSubmit = async () => {
    if (!app || !selectedSkill) return;

    setSubmitting(true);
    setError(null);

    try {
      if (!api) {
        throw new Error('Migration Intelligence API not available');
      }

      // Call the backend to create a real PipelineRun
      const response = await api.startMigration({
        applicationName: app.name,
        sourceRepo: app.sourceRepository || `https://github.com/konveyor-ecosystem/${app.name}`,
        skill: selectedSkill,
      });

      setResult(response);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Migration failed:', err);
      setError(err.message || 'Failed to start migration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleClose = () => {
    setActiveStep(0);
    setSelectedApp('');
    setSelectedSkill('');
    setSubmitted(false);
    setSubmitting(false);
    setError(null);
    setResult(null);
    onClose();
  };

  const canProceed = () => {
    if (activeStep === 0) return !!selectedApp;
    if (activeStep === 1) return !!selectedSkill;
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
                {(applications || []).map(a => (
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
                  <Chip label={app.sourceTechnology} size="small" className={classes.chip} />
                  <Chip label="→" size="small" variant="outlined" className={classes.chip} />
                  <Chip label={app.targetTechnology} size="small" color="primary" className={classes.chip} />
                </Box>
                {app.sourceRepository && (
                  <Typography variant="caption" color="textSecondary" style={{ marginTop: 8, display: 'block' }}>
                    Repo: {app.sourceRepository}
                  </Typography>
                )}
              </Paper>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              Choose a migration skill:
            </Typography>
            <FormControl variant="outlined" className={classes.formControl}>
              <InputLabel>Skill</InputLabel>
              <Select
                value={selectedSkill}
                onChange={e => setSelectedSkill(e.target.value as string)}
                label="Skill"
              >
                {availableSkills.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {skill && (
              <Paper variant="outlined" className={classes.summary}>
                <Typography variant="subtitle2">{skill.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {skill.description}
                </Typography>
              </Paper>
            )}
          </Box>
        );

      case 2:
        if (submitted && result) {
          return (
            <Alert severity="success">
              <strong>PipelineRun created!</strong><br />
              Migration of <strong>{app?.name}</strong> is now running.<br />
              PipelineRun: <code>{result.pipelineRunName || result.migrationId}</code><br />
              Skill: {selectedSkill}
            </Alert>
          );
        }

        if (error) {
          return (
            <Alert severity="error">
              <strong>Failed to start migration:</strong><br />
              {error}
            </Alert>
          );
        }

        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              Review and start the migration:
            </Typography>
            <Paper variant="outlined" className={classes.summary}>
              <Typography variant="subtitle2" gutterBottom>Migration Summary</Typography>
              <Typography variant="body2"><strong>Application:</strong> {app?.name}</Typography>
              <Typography variant="body2"><strong>Source:</strong> {app?.sourceTechnology}</Typography>
              <Typography variant="body2"><strong>Target:</strong> {app?.targetTechnology}</Typography>
              <Typography variant="body2"><strong>Repository:</strong> {app?.sourceRepository || `https://github.com/konveyor-ecosystem/${app?.name}`}</Typography>
              <Typography variant="body2"><strong>Skill:</strong> {skill?.name}</Typography>
              <Box mt={2}>
                <Alert severity="info">
                  This will create a Tekton PipelineRun on the cluster. The migration agent
                  (goose + {selectedSkill} skill) will clone the repo, analyze it, and apply
                  code transformations using Claude via AWS Bedrock.
                </Alert>
              </Box>
            </Paper>
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
        <Button onClick={handleClose}>
          {submitted ? 'Close' : 'Cancel'}
        </Button>
        {activeStep > 0 && !submitted && !submitting && (
          <Button onClick={handleBack}>Back</Button>
        )}
        {!submitted && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={!canProceed() || submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : undefined}
          >
            {submitting ? 'Creating...' : activeStep === steps.length - 1 ? 'Create PipelineRun' : 'Next'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
