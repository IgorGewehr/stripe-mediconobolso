'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Switch,
  Skeleton,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  FollowUpRuleTypeLabels,
  NotificationChannelLabels,
  crmService,
} from '@/lib/services/api';

const formatDays = crmService.formatDaysLabel;

function RuleItem({ rule, onEdit, onDelete, onToggleActive, saving }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(rule);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(rule.id);
  };

  return (
    <ListItem
      sx={{
        borderRadius: 1,
        mb: 1,
        bgcolor: rule.active ? 'background.paper' : 'action.disabledBackground',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography fontWeight="medium">{rule.name}</Typography>
            <Chip
              label={FollowUpRuleTypeLabels[rule.rule_type] || rule.rule_type}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        }
        secondary={
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Disparo: {formatDays(rule.trigger_days)} |{' '}
              Canais: {rule.channels?.map(c => NotificationChannelLabels[c] || c).join(', ')}
            </Typography>
          </Box>
        }
      />
      <ListItemSecondaryAction>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={rule.active ? 'Desativar' : 'Ativar'}>
            <Switch
              size="small"
              checked={rule.active}
              onChange={(e) => onToggleActive(rule.id, e.target.checked)}
              disabled={saving}
            />
          </Tooltip>
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleEdit}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Editar
            </MenuItem>
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Excluir
            </MenuItem>
          </Menu>
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
  );
}

function RuleTypeSection({ title, rules, onEdit, onDelete, onToggleActive, saving }) {
  if (!rules || rules.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <List disablePadding>
        {rules.map((rule) => (
          <RuleItem
            key={rule.id}
            rule={rule}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
            saving={saving}
          />
        ))}
      </List>
    </Box>
  );
}

export default function FollowUpRulesList({
  rules,
  rulesByType,
  loading,
  saving,
  error,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  onRefresh,
}) {
  if (loading && (!rules || rules.length === 0)) {
    return (
      <Card>
        <CardHeader title="Regras de Follow-up" />
        <Divider />
        <CardContent>
          <Skeleton height={60} sx={{ mb: 1 }} />
          <Skeleton height={60} sx={{ mb: 1 }} />
          <Skeleton height={60} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Regras de Follow-up"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Atualizar">
              <IconButton onClick={onRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={onAdd}
            >
              Nova Regra
            </Button>
          </Box>
        }
      />
      <Divider />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {(!rules || rules.length === 0) ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Nenhuma regra de follow-up configurada
            </Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={onAdd}>
              Criar primeira regra
            </Button>
          </Box>
        ) : (
          <>
            <RuleTypeSection
              title="Pós-Consulta"
              rules={rulesByType?.post_consultation}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
              saving={saving}
            />
            <RuleTypeSection
              title="Retorno Pendente"
              rules={rulesByType?.pending_return}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
              saving={saving}
            />
            <RuleTypeSection
              title="Inatividade"
              rules={rulesByType?.inactivity}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleActive={onToggleActive}
              saving={saving}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
