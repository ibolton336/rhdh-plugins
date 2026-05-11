import { useState } from 'react';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  StatusOK,
  StatusWarning,
  Progress,
  InfoCard,
} from '@backstage/core-components';
import {
  Chip,
  Button,
  Typography,
  Box,
  Grid,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
        {(!agents || agents.length === 0) ? (
          <InfoCard title="No Agent Definitions">
            <Typography variant="body1">
              No agent definitions found. Create one to get started.
            </Typography>
          </InfoCard>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>LLM Provider</TableCell>
                  <TableCell>Skill</TableCell>
                  <TableCell>Rules</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agents.map((row: AgentDefinition) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Typography variant="body2" style={{ fontWeight: 600 }}>
                        {row.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {row.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.llmProvider}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {row.llmEndpoint}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={row.skill} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" style={{ gap: 4 }}>
                        {(row.rules || []).map(r => (
                          <Chip key={r} label={r} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" style={{ gap: 4 }}>
                        {(row.sourceTechnologies || []).map(t => (
                          <Chip key={t} label={t} size="small" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexWrap="wrap" style={{ gap: 4 }}>
                        {(row.targetTechnologies || []).map(t => (
                          <Chip key={t} label={t} size="small" color="primary" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {row.status === 'active' ? (
                        <StatusOK>Active</StatusOK>
                      ) : (
                        <StatusWarning>Draft</StatusWarning>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <CreateAgentDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </Content>
    </Page>
  );
};

export { AgentDefinitionsPage as AgentDefinitionsContent };
