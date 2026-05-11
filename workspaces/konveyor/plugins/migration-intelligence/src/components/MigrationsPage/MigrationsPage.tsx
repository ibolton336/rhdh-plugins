import { useState, useEffect, useRef } from 'react';
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
} from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { useApi } from '@backstage/core-plugin-api';
import { migrationIntelligenceApiRef } from '../../api';

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

function MigrationRow({ migration }: { migration: any }) {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<string | null>(null);

  let api: any;
  try {
    api = useApi(migrationIntelligenceApiRef);
  } catch {
    api = null;
  }

  const handleExpand = async () => {
    if (!expanded && !logs && api) {
      try {
        const detail = await api.getMigration(migration.id);
        setLogs(detail.logs || 'No logs available');
      } catch {
        setLogs('Failed to fetch logs');
      }
    }
    setExpanded(!expanded);
  };

  const duration = migration.startedAt
    ? (() => {
        const start = new Date(migration.startedAt).getTime();
        const end = migration.completedAt ? new Date(migration.completedAt).getTime() : Date.now();
        const seconds = Math.floor((end - start) / 1000);
        if (seconds < 60) return `${seconds}s`;
        return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
      })()
    : '—';

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={handleExpand}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" style={{ fontWeight: 600 }}>
            {migration.pipelineRunName || migration.name || migration.id}
          </Typography>
        </TableCell>
        <TableCell>{migration.applicationName || '—'}</TableCell>
        <TableCell>
          <StatusIndicator status={migration.status} />
        </TableCell>
        <TableCell>{duration}</TableCell>
        <TableCell>
          {migration.startedAt
            ? new Date(migration.startedAt).toLocaleString()
            : '—'}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box margin={2}>
              <Typography variant="subtitle2" gutterBottom>
                Logs
              </Typography>
              <Paper
                variant="outlined"
                style={{
                  padding: 12,
                  backgroundColor: '#1e1e1e',
                  color: '#d4d4d4',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  maxHeight: 300,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {logs || 'Loading...'}
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
  const fetchedRef = useRef(false);
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
        setMigrations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setMigrations([]);
        setError(err);
        setLoading(false);
      });
  }, [api, refreshKey]);

  // Auto-refresh every 10s if there are running migrations
  useEffect(() => {
    const hasRunning = migrations.some(m => m.status === 'running' || m.status === 'pending');
    if (!hasRunning) return;

    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, [migrations]);

  if (loading) return <Progress />;

  return (
    <Page themeId="tool">
      <Header
        title="Migrations"
        subtitle="Track active and completed migration pipeline runs"
      />
      <Content>
        <ContentHeader title="Pipeline Runs">
          <Chip
            label={`${migrations.length} total`}
            size="small"
            variant="outlined"
          />
          <IconButton
            size="small"
            onClick={() => setRefreshKey(prev => prev + 1)}
            title="Refresh"
          >
            <RefreshIcon />
          </IconButton>
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
                  <TableCell>PipelineRun</TableCell>
                  <TableCell>Application</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Started</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {migrations.map((m: any) => (
                  <MigrationRow key={m.id || m.pipelineRunName} migration={m} />
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
