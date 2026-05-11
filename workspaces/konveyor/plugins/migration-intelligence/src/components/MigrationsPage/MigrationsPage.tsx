import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  StatusOK,
  StatusRunning,
  StatusPending,
  StatusError,
  Progress,
  InfoCard,
} from '@backstage/core-components';
import {
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import RefreshIcon from '@material-ui/icons/Refresh';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import { useApi } from '@backstage/core-plugin-api';
import { migrationIntelligenceApiRef } from '../../api';

const useStyles = makeStyles(theme => ({
  logContainer: {
    padding: 12,
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: '0.75rem',
    maxHeight: 400,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
    borderRadius: 4,
  },
  stepperRoot: {
    padding: theme.spacing(1, 0),
    backgroundColor: 'transparent',
  },
  activeStep: {
    '& .MuiStepIcon-root.MuiStepIcon-active': {
      color: theme.palette.info.main,
    },
  },
  succeededChip: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  failedChip: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  runningChip: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
  },
  elapsedTime: {
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    color: theme.palette.text.secondary,
  },
}));

const PIPELINE_STEPS = ['Clone Repository', 'Run Migration Agent', 'Commit Results'];

function StatusIndicator({ status }: { status: string }) {
  switch (status) {
    case 'succeeded':
    case 'completed':
      return <StatusOK>Succeeded</StatusOK>;
    case 'running':
      return <StatusRunning>Running</StatusRunning>;
    case 'pending':
      return <StatusPending>Pending</StatusPending>;
    case 'failed':
      return <StatusError>Failed</StatusError>;
    default:
      return <StatusPending>{status}</StatusPending>;
  }
}

function ElapsedTime({ startedAt, completedAt, status }: { startedAt?: string; completedAt?: string; status: string }) {
  const classes = useStyles();
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startedAt) return;

    const update = () => {
      const start = new Date(startedAt).getTime();
      const end = completedAt ? new Date(completedAt).getTime() : Date.now();
      const seconds = Math.floor((end - start) / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      setElapsed(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    update();
    if (status === 'running' || status === 'pending') {
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [startedAt, completedAt, status]);

  return <Typography className={classes.elapsedTime}>{elapsed}</Typography>;
}

function PipelineProgress({ status, taskRuns }: { status: string; taskRuns?: any[] }) {
  const classes = useStyles();

  let activeStep = 0;
  if (status === 'succeeded' || status === 'completed') {
    activeStep = 3;
  } else if (status === 'failed') {
    activeStep = taskRuns?.length || 1;
  } else if (status === 'running') {
    // Determine which step based on taskRuns
    activeStep = Math.min((taskRuns?.length || 0) + 1, 2);
  }

  return (
    <Stepper activeStep={activeStep} className={classes.stepperRoot} alternativeLabel>
      {PIPELINE_STEPS.map((label, index) => {
        const isCompleted = index < activeStep;
        const isFailed = status === 'failed' && index === activeStep;
        return (
          <Step key={label} completed={isCompleted}>
            <StepLabel
              error={isFailed}
              StepIconProps={{
                icon: isFailed ? <ErrorIcon color="error" /> : isCompleted ? <CheckCircleIcon style={{ color: '#4caf50' }} /> : undefined,
              }}
            >
              {label}
            </StepLabel>
          </Step>
        );
      })}
    </Stepper>
  );
}

function MigrationRow({ migration, defaultExpanded }: { migration: any; defaultExpanded?: boolean }) {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(defaultExpanded || false);
  const [logs, setLogs] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  let api: any;
  try {
    api = useApi(migrationIntelligenceApiRef);
  } catch {
    api = null;
  }

  const fetchLogs = useCallback(async () => {
    if (!api || !migration.pipelineRunName) return;
    setLogsLoading(true);
    try {
      const detail = await api.getMigration(migration.id || migration.pipelineRunName);
      setLogs(detail.logs || 'Waiting for logs...');
    } catch {
      setLogs('Logs not available yet — container may still be starting.');
    }
    setLogsLoading(false);
  }, [api, migration.id, migration.pipelineRunName]);

  // Auto-fetch logs when expanded
  useEffect(() => {
    if (!expanded) return;
    fetchLogs();

    // Poll logs while running
    if (migration.status === 'running' || migration.status === 'pending') {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [expanded, migration.status, fetchLogs]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const isRunning = migration.status === 'running' || migration.status === 'pending';

  return (
    <>
      <TableRow hover onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        <TableCell>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" style={{ fontWeight: 600 }}>
            {migration.pipelineRunName || migration.id}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {migration.applicationName || '—'}
          </Typography>
        </TableCell>
        <TableCell>
          <StatusIndicator status={migration.status} />
        </TableCell>
        <TableCell>
          <ElapsedTime
            startedAt={migration.startedAt}
            completedAt={migration.completedAt}
            status={migration.status}
          />
        </TableCell>
        <TableCell>
          <PipelineProgress status={migration.status} taskRuns={migration.taskRuns} />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box margin={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2">
                  Logs {isRunning && '(live)'}
                </Typography>
                {isRunning && (
                  <Chip label="Streaming..." size="small" className={classes.runningChip} />
                )}
              </Box>
              {logsLoading && !logs && <LinearProgress />}
              <Paper variant="outlined">
                <div ref={logContainerRef} className={classes.logContainer}>
                  {logs || 'Loading...'}
                </div>
              </Paper>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export const MigrationsPage = () => {
  const [migrations, setMigrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  let api: any;
  try {
    api = useApi(migrationIntelligenceApiRef);
  } catch {
    api = null;
  }

  useEffect(() => {
    if (!api) {
      setLoading(false);
      setError(new Error('Backend API not available'));
      return;
    }

    setLoading(true);
    api.getMigrations()
      .then((data: any[]) => {
        const sorted = (Array.isArray(data) ? data : []).sort((a: any, b: any) => {
          const aTime = new Date(a.startedAt || 0).getTime();
          const bTime = new Date(b.startedAt || 0).getTime();
          return bTime - aTime;
        });
        setMigrations(sorted);
        setLoading(false);
      })
      .catch((err: Error) => {
        setMigrations([]);
        setError(err);
        setLoading(false);
      });
  }, [api, refreshKey]);

  // Auto-refresh every 8s if there are running migrations
  useEffect(() => {
    const hasRunning = migrations.some(m => m.status === 'running' || m.status === 'pending');
    if (!hasRunning) return;

    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 8000);

    return () => clearInterval(interval);
  }, [migrations]);

  if (loading) return <Progress />;

  const runningCount = migrations.filter(m => m.status === 'running' || m.status === 'pending').length;
  const succeededCount = migrations.filter(m => m.status === 'succeeded' || m.status === 'completed').length;
  const failedCount = migrations.filter(m => m.status === 'failed').length;

  return (
    <Page themeId="tool">
      <Header
        title="Migrations"
        subtitle="Track active and completed migration pipeline runs"
      />
      <Content>
        <ContentHeader title="Pipeline Runs">
          <Box display="flex" style={{ gap: 8 }} alignItems="center">
            {runningCount > 0 && <Chip label={`${runningCount} running`} size="small" color="primary" />}
            {succeededCount > 0 && <Chip label={`${succeededCount} succeeded`} size="small" />}
            {failedCount > 0 && <Chip label={`${failedCount} failed`} size="small" color="secondary" />}
            <IconButton
              size="small"
              onClick={() => setRefreshKey(prev => prev + 1)}
              title="Refresh"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </ContentHeader>

        {error && (
          <Box mb={2}>
            <InfoCard title="Error">
              <Typography color="error">{error.message}</Typography>
            </InfoCard>
          </Box>
        )}

        {migrations.length === 0 ? (
          <InfoCard title="No Migrations">
            <Typography variant="body1">
              No migration runs found. Start a migration from the Dashboard to see runs here.
            </Typography>
          </InfoCard>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={50} />
                  <TableCell>Migration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Progress</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {migrations.map((m: any, idx: number) => (
                  <MigrationRow
                    key={m.id || m.pipelineRunName}
                    migration={m}
                    defaultExpanded={idx === 0 && (m.status === 'running' || m.status === 'pending')}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Content>
    </Page>
  );
};

export { MigrationsPage as MigrationsContent };
