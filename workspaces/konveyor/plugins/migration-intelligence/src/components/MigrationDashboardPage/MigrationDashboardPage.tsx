import React, { useState } from 'react';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
  Table,
  TableColumn,
  StatusOK,
  StatusRunning,
  StatusPending,
  StatusError,
  InfoCard,
} from '@backstage/core-components';
import {
  Grid,
  Chip,
  Button,
  Typography,
  LinearProgress,
  Box,
  Card,
  CardContent,
  CardActions,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CloudIcon from '@material-ui/icons/Cloud';
import BuildIcon from '@material-ui/icons/Build';
import AssessmentIcon from '@material-ui/icons/Assessment';

import {
  mockApplications,
  mockMigrators,
  ApplicationMigration,
  Migrator,
  MigrationStatus,
} from './mockData';
import { StartMigrationDialog } from '../StartMigrationDialog';

const useStyles = makeStyles(theme => ({
  migratorCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  progressBar: { height: 8, borderRadius: 4 },
  statsGrid: { marginBottom: theme.spacing(3) },
  statCard: { textAlign: 'center', padding: theme.spacing(2) },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 700,
    color: theme.palette.primary.main,
  },
  statLabel: { color: theme.palette.text.secondary, fontSize: '0.875rem' },
  complexityHigh: { backgroundColor: '#ffebee', color: '#c62828' },
  complexityMedium: { backgroundColor: '#fff3e0', color: '#e65100' },
  complexityLow: { backgroundColor: '#e8f5e9', color: '#2e7d32' },
}));

function StatusIndicator({ status }: { status: MigrationStatus }) {
  switch (status) {
    case 'completed':
      return <StatusOK>Completed</StatusOK>;
    case 'in-progress':
      return <StatusRunning>In Progress</StatusRunning>;
    case 'pending':
      return <StatusPending>Pending</StatusPending>;
    case 'failed':
      return <StatusError>Failed</StatusError>;
    default:
      return <StatusPending>Unknown</StatusPending>;
  }
}

function DashboardStats() {
  const classes = useStyles();
  const total = mockApplications.length;
  const completed = mockApplications.filter(
    a => a.status === 'completed',
  ).length;
  const inProgress = mockApplications.filter(
    a => a.status === 'in-progress',
  ).length;
  const pending = mockApplications.filter(a => a.status === 'pending').length;
  const failed = mockApplications.filter(a => a.status === 'failed').length;

  const stats = [
    { label: 'Total', value: total, icon: '📦' },
    { label: 'Completed', value: completed, icon: '✅' },
    { label: 'In Progress', value: inProgress, icon: '🔄' },
    { label: 'Pending', value: pending, icon: '⏳' },
    { label: 'Failed', value: failed, icon: '❌' },
  ];

  return (
    <Grid container spacing={2} className={classes.statsGrid}>
      {stats.map(stat => (
        <Grid item xs={12} sm={6} md key={stat.label}>
          <Card variant="outlined" className={classes.statCard}>
            <Typography variant="h6">{stat.icon}</Typography>
            <Typography className={classes.statNumber}>{stat.value}</Typography>
            <Typography className={classes.statLabel}>{stat.label}</Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function MigratorCard({ migrator }: { migrator: Migrator }) {
  const classes = useStyles();
  const typeIcon = {
    'ai-agent': <CloudIcon fontSize="small" />,
    manual: <BuildIcon fontSize="small" />,
    hybrid: <AssessmentIcon fontSize="small" />,
  };
  const statusColor = {
    available: 'primary' as const,
    busy: 'default' as const,
    offline: 'secondary' as const,
  };

  return (
    <Card variant="outlined" className={classes.migratorCard}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          {typeIcon[migrator.type]}
          <Typography variant="h6" style={{ marginLeft: 8 }}>
            {migrator.name}
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary" paragraph>
          {migrator.description}
        </Typography>
        <Box display="flex" flexWrap="wrap" mb={1} style={{ gap: 4 }}>
          <Chip
            label={migrator.type}
            size="small"
            color={statusColor[migrator.status]}
          />
          <Chip
            label={`Skill: ${migrator.skill}`}
            size="small"
            variant="outlined"
          />
        </Box>
        {migrator.successRate && (
          <Typography variant="caption" color="textSecondary">
            Success rate: {migrator.successRate}% · Duration:{' '}
            {migrator.avgDuration}
          </Typography>
        )}
      </CardContent>
      <CardActions>
        <Chip
          label={migrator.status.toUpperCase()}
          size="small"
          color={statusColor[migrator.status]}
        />
      </CardActions>
    </Card>
  );
}

export const MigrationDashboardPage = () => {
  const classes = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);

  const columns: TableColumn<ApplicationMigration>[] = [
    {
      title: 'Application',
      field: 'name',
      render: row => (
        <Box>
          <Typography variant="body1" style={{ fontWeight: 600 }}>
            {row.name}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {row.description}
          </Typography>
        </Box>
      ),
    },
    {
      title: 'Source',
      field: 'sourceTechnology',
      render: row => (
        <Chip label={row.sourceTechnology} size="small" variant="outlined" />
      ),
    },
    {
      title: 'Target',
      field: 'targetTechnology',
      render: row => (
        <Chip label={row.targetTechnology} size="small" color="primary" />
      ),
    },
    {
      title: 'Complexity',
      field: 'complexity',
      render: row => (
        <Chip
          label={row.complexity}
          size="small"
          className={
            row.complexity === 'high'
              ? classes.complexityHigh
              : row.complexity === 'medium'
                ? classes.complexityMedium
                : classes.complexityLow
          }
        />
      ),
    },
    {
      title: 'Status',
      field: 'status',
      render: row => (
        <Box>
          <StatusIndicator status={row.status} />
          {row.progress !== undefined && row.status === 'in-progress' && (
            <Box mt={0.5}>
              <LinearProgress
                variant="determinate"
                value={row.progress}
                className={classes.progressBar}
              />
              <Typography variant="caption">{row.progress}%</Typography>
            </Box>
          )}
        </Box>
      ),
    },
    {
      title: 'Issues',
      render: row =>
        row.issuesFound ? (
          <Typography variant="body2">
            {row.issuesResolved}/{row.issuesFound} resolved
          </Typography>
        ) : (
          <Typography variant="body2" color="textSecondary">
            —
          </Typography>
        ),
    },
    {
      title: 'Updated',
      field: 'lastUpdated',
      render: row => (
        <Typography variant="body2">
          {new Date(row.lastUpdated).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Typography>
      ),
    },
  ];

  return (
    <Page themeId="tool">
      <Header
        title="Migration Intelligence"
        subtitle="Manage and monitor application migrations to modern runtimes"
      />
      <Content>
        <ContentHeader title="Dashboard">
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Start Migration
          </Button>
          <SupportButton>
            Migration Intelligence helps you migrate applications from legacy
            frameworks (Java EE, Spring Boot) to modern cloud-native runtimes
            (Quarkus). Part of the Konveyor ecosystem.
          </SupportButton>
        </ContentHeader>

        <DashboardStats />

        <InfoCard
          title="Applications"
          subheader="Track migration progress across your portfolio"
        >
          <Table
            columns={columns}
            data={mockApplications}
            title=""
            options={{ search: true, paging: false, padding: 'dense' }}
          />
        </InfoCard>

        <Box mt={3}>
          <ContentHeader title="Available Migrators" />
          <Grid container spacing={3}>
            {mockMigrators.map(migrator => (
              <Grid item xs={12} md={4} key={migrator.id}>
                <MigratorCard migrator={migrator} />
              </Grid>
            ))}
          </Grid>
        </Box>

        <StartMigrationDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          applications={mockApplications.filter(a => a.status === 'pending')}
          migrators={mockMigrators.filter(m => m.status === 'available')}
        />
      </Content>
    </Page>
  );
};
