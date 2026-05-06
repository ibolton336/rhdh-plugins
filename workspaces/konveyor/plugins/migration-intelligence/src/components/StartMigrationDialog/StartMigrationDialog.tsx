import React, { useState } from 'react';
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

import {
  ApplicationMigration,
  Migrator,
} from '../MigrationDashboardPage/mockData';

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
  migrators: Migrator[];
}

const steps = ['Select Application', 'Choose Migrator', 'Review & Start'];

export const StartMigrationDialog = ({
  open,
  onClose,
  applications,
  migrators,
}: StartMigrationDialogProps) => {
  const classes = useStyles();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [selectedMigrator, setSelectedMigrator] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  const app = applications.find(a => a.id === selectedApp);
  const migrator = migrators.find(m => m.id === selectedMigrator);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      setSubmitted(true);
      setTimeout(() => handleClose(), 2000);
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleClose = () => {
    setActiveStep(0);
    setSelectedApp('');
    setSelectedMigrator('');
    setSubmitted(false);
    onClose();
  };

  const canProceed = () => {
    if (activeStep === 0) return !!selectedApp;
    if (activeStep === 1) return !!selectedMigrator;
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
                  <Chip
                    label={`Complexity: ${app.complexity}`}
                    size="small"
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
              Choose a migrator:
            </Typography>
            <FormControl variant="outlined" className={classes.formControl}>
              <InputLabel>Migrator</InputLabel>
              <Select
                value={selectedMigrator}
                onChange={e => setSelectedMigrator(e.target.value as string)}
                label="Migrator"
              >
                {migrators.map(m => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name} ({m.type}) — {m.avgDuration}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {migrator && (
              <Paper variant="outlined" className={classes.summary}>
                <Typography variant="subtitle2">{migrator.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {migrator.description}
                </Typography>
                <Box mt={1}>
                  <Chip
                    label={`Type: ${migrator.type}`}
                    size="small"
                    className={classes.chip}
                  />
                  <Chip
                    label={`Skill: ${migrator.skill}`}
                    size="small"
                    className={classes.chip}
                  />
                  {migrator.successRate && (
                    <Chip
                      label={`${migrator.successRate}% success`}
                      size="small"
                      color="primary"
                      className={classes.chip}
                    />
                  )}
                </Box>
              </Paper>
            )}
          </Box>
        );

      case 2:
        return submitted ? (
          <Alert severity="success">
            Migration started! {app?.name} is now being migrated using{' '}
            {migrator?.name}.
          </Alert>
        ) : (
          <Box>
            <Typography variant="body1" gutterBottom>
              Confirm migration:
            </Typography>
            <Paper variant="outlined" className={classes.summary}>
              <Typography variant="body2">
                <strong>App:</strong> {app?.name}
              </Typography>
              <Typography variant="body2">
                <strong>From:</strong> {app?.sourceTechnology}
              </Typography>
              <Typography variant="body2">
                <strong>To:</strong> {app?.targetTechnology}
              </Typography>
              <Typography variant="body2">
                <strong>Migrator:</strong> {migrator?.name} ({migrator?.type})
              </Typography>
              <Typography variant="body2">
                <strong>Skill:</strong> {migrator?.skill}
              </Typography>
              <Typography variant="body2">
                <strong>Est:</strong> {migrator?.avgDuration}
              </Typography>
              <Box mt={1}>
                <Alert severity="info">
                  This will create a TaskGroup in Konveyor Hub and dispatch the
                  addon to process the migration. A new branch will be created
                  with migrated code.
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
            {activeStep === steps.length - 1 ? 'Start Migration' : 'Next'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
