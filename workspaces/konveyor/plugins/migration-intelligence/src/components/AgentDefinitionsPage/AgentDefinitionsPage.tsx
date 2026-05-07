import { useState } from 'react';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  Table,
  TableColumn,
  StatusOK,
  StatusWarning,
  Progress,
} from '@backstage/core-components';
import {
  Chip,
  Button,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Input,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { Alert } from '@material-ui/lab';

import {
  AgentDefinition,
  availableLLMProviders,
  availableRules,
} from './mockData';
import { useAgentDefinitions } from '../../hooks/useApi';

function CreateAgentDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [llmProvider, setLlmProvider] = useState('');
  const [skill, setSkill] = useState('');
  const [rules, setRules] = useState<string[]>([]);
  const [sourceTechs, setSourceTechs] = useState('');
  const [targetTechs, setTargetTechs] = useState('');

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Agent Definition</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          fullWidth
          margin="normal"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. java-ee-to-quarkus"
        />
        <TextField
          label="Description"
          fullWidth
          margin="normal"
          multiline
          rows={2}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <TextField
          label="LLM Provider"
          fullWidth
          margin="normal"
          select
          value={llmProvider}
          onChange={e => setLlmProvider(e.target.value)}
        >
          {availableLLMProviders.map(p => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Skill Reference"
          fullWidth
          margin="normal"
          value={skill}
          onChange={e => setSkill(e.target.value)}
          placeholder="konveyor/skill-name.md"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Rules</InputLabel>
          <Select
            multiple
            value={rules}
            onChange={e => setRules(e.target.value as string[])}
            input={<Input />}
            renderValue={selected => (selected as string[]).join(', ')}
          >
            {availableRules.map(r => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Source Technologies (comma-separated)"
          fullWidth
          margin="normal"
          value={sourceTechs}
          onChange={e => setSourceTechs(e.target.value)}
        />
        <TextField
          label="Target Technologies (comma-separated)"
          fullWidth
          margin="normal"
          value={targetTechs}
          onChange={e => setTargetTechs(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onClose} color="primary" variant="contained">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export const AgentDefinitionsPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { agents, loading, error } = useAgentDefinitions();

  const columns: TableColumn<AgentDefinition>[] = [
    {
      title: 'Name',
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
      title: 'LLM Provider',
      field: 'llmProvider',
      render: row => (
        <Box>
          <Typography variant="body2">{row.llmProvider}</Typography>
          <Typography variant="caption" color="textSecondary">
            {row.llmEndpoint}
          </Typography>
        </Box>
      ),
    },
    {
      title: 'Skill',
      field: 'skill',
      render: row => <Chip label={row.skill} size="small" variant="outlined" />,
    },
    {
      title: 'Rules',
      field: 'rules',
      render: row => (
        <Box display="flex" flexWrap="wrap" style={{ gap: 4 }}>
          {row.rules.map(r => (
            <Chip key={r} label={r} size="small" variant="outlined" />
          ))}
        </Box>
      ),
    },
    {
      title: 'Source',
      field: 'sourceTechnologies',
      render: row => (
        <Box display="flex" flexWrap="wrap" style={{ gap: 4 }}>
          {row.sourceTechnologies.map(t => (
            <Chip key={t} label={t} size="small" />
          ))}
        </Box>
      ),
    },
    {
      title: 'Target',
      field: 'targetTechnologies',
      render: row => (
        <Box display="flex" flexWrap="wrap" style={{ gap: 4 }}>
          {row.targetTechnologies.map(t => (
            <Chip key={t} label={t} size="small" color="primary" />
          ))}
        </Box>
      ),
    },
    {
      title: 'Status',
      field: 'status',
      render: row =>
        row.status === 'active' ? (
          <StatusOK>Active</StatusOK>
        ) : (
          <StatusWarning>Draft</StatusWarning>
        ),
    },
  ];

  if (loading) return <Progress />;

  return (
    <Page themeId="tool">
      <Header
        title="Agent Definitions"
        subtitle="Configure reusable migration agent definitions"
      />
      <Content>
        <ContentHeader title="Agent Definitions">
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Create Agent Definition
          </Button>
        </ContentHeader>
        {error && (
          <Alert severity="warning" style={{ marginBottom: 16 }}>
            Using mock data — backend unavailable
          </Alert>
        )}
        <Table
          columns={columns}
          data={agents}
          title=""
          options={{ search: true, paging: false, padding: 'dense' }}
        />
        <CreateAgentDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </Content>
    </Page>
  );
};
