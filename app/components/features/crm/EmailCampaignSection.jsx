'use client';

/**
 * @fileoverview Email Campaign Section - Mass Email Sending
 * @description Elegant component for configuring and sending mass emails to patients
 * Now uses the backend API for campaign management with scheduling and rate limiting
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Mail,
  Send,
  Users,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Sparkles,
  X,
  ChevronDown,
  UserCheck,
  CalendarDays,
  Activity,
  Upload,
  Play,
  Pause,
  Square,
  RefreshCw,
  BarChart3,
  Calendar,
  List,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePatients } from '../../hooks';
import { format, subDays, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import emailCampaignService, {
  CampaignStatus,
  CampaignStatusLabels,
  CampaignStatusColors,
  CampaignSourceType,
  formatCampaignMetrics,
  canStartCampaign,
  canPauseCampaign,
  canResumeCampaign,
  canCancelCampaign,
  canEditCampaign,
  isCampaignTerminal,
} from '@/lib/services/api/emailCampaign.service';

// ============================================================================
// UI Components
// ============================================================================

const Card = ({ className, children }) => (
  <div
    className={cn(
      'rounded-xl border border-slate-200/60 bg-white shadow-sm',
      className
    )}
  >
    {children}
  </div>
);

const CardHeader = ({ className, children }) => (
  <div className={cn('p-5 border-b border-slate-100', className)}>
    {children}
  </div>
);

const CardContent = ({ className, children }) => (
  <div className={cn('p-5', className)}>{children}</div>
);

// ============================================================================
// Email Templates
// ============================================================================

const EMAIL_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Boas-vindas',
    icon: Sparkles,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    subject: 'Bem-vindo(a) ao nosso consultorio!',
    body: `Ola {{nome}},

Seja muito bem-vindo(a)! Estamos felizes em te-lo(a) como paciente.

Nosso compromisso e cuidar da sua saude com excelencia e dedicacao.

Qualquer duvida, estamos a disposicao.

Atenciosamente,
{{medico}}`,
  },
  {
    id: 'reminder',
    name: 'Lembrete de Retorno',
    icon: CalendarDays,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    subject: 'Hora de agendar seu retorno!',
    body: `Ola {{nome}},

Notamos que ja faz um tempo desde sua ultima consulta.

Que tal agendar seu retorno? Manter o acompanhamento regular e fundamental para sua saude.

Entre em contato conosco para agendar.

Abracos,
{{medico}}`,
  },
  {
    id: 'checkup',
    name: 'Check-up Anual',
    icon: Activity,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    subject: 'Lembrete: Check-up Anual',
    body: `Ola {{nome}},

Esta na hora do seu check-up anual!

Realizar exames periodicos e essencial para prevenir doencas e manter sua saude em dia.

Agende sua consulta e cuide de voce.

Com carinho,
{{medico}}`,
  },
  {
    id: 'custom',
    name: 'Personalizado',
    icon: FileText,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    subject: '',
    body: '',
  },
];

// ============================================================================
// Segment Filters
// ============================================================================

const SEGMENT_FILTERS = [
  { id: 'all', label: 'Todos os Pacientes', icon: Users, filter: null },
  { id: 'inactive_30', label: 'Inativos 30+ dias', icon: Clock, filter: { inactive_days: 30 } },
  { id: 'inactive_90', label: 'Inativos 90+ dias', icon: AlertCircle, filter: { inactive_days: 90 } },
  { id: 'recent', label: 'Ultimas consultas (7 dias)', icon: CheckCircle2, filter: { recent_days: 7 } },
];

// ============================================================================
// Main Component
// ============================================================================

export default function EmailCampaignSection({ onSuccess, onError }) {
  // Tab state
  const [activeTab, setActiveTab] = useState(0); // 0 = Nova Campanha, 1 = Campanhas

  // Campaign creation state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState('all');
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [sendingMode, setSendingMode] = useState('now'); // 'now' or 'scheduled'

  // Campaign list state
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetailsOpen, setCampaignDetailsOpen] = useState(false);

  // CSV Import state
  const [importOpen, setImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [importing, setImporting] = useState(false);

  // Loading states
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // File input ref
  const fileInputRef = useRef(null);

  // Hooks
  const { patients, loading: loadingPatients } = usePatients({ autoLoad: true });

  // Load campaigns on mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  // Auto-refresh campaigns every 30 seconds when there's an active campaign
  useEffect(() => {
    const hasActiveCampaign = campaigns.some(
      c => c.status === CampaignStatus.SENDING || c.status === CampaignStatus.SCHEDULED
    );

    if (hasActiveCampaign) {
      const interval = setInterval(loadCampaigns, 30000);
      return () => clearInterval(interval);
    }
  }, [campaigns]);

  // Load campaigns from API
  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const result = await emailCampaignService.listCampaigns({ perPage: 50 });
      setCampaigns(result.items || []);
    } catch (err) {
      console.error('Erro ao carregar campanhas:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // Filter patients based on segment and search
  const filteredPatients = useCallback(() => {
    if (!patients) return [];

    let filtered = [...patients];
    const today = new Date();

    // Apply segment filter
    switch (segment) {
      case 'inactive_30':
        filtered = filtered.filter((p) => {
          const lastVisit = p.lastConsultationDate
            ? new Date(p.lastConsultationDate)
            : null;
          return !lastVisit || lastVisit < subDays(today, 30);
        });
        break;
      case 'inactive_90':
        filtered = filtered.filter((p) => {
          const lastVisit = p.lastConsultationDate
            ? new Date(p.lastConsultationDate)
            : null;
          return !lastVisit || lastVisit < subDays(today, 90);
        });
        break;
      case 'recent':
        filtered = filtered.filter((p) => {
          const lastVisit = p.lastConsultationDate
            ? new Date(p.lastConsultationDate)
            : null;
          return lastVisit && lastVisit >= subDays(today, 7);
        });
        break;
      default:
        break;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.patientName || p.name || '').toLowerCase().includes(query) ||
          (p.patientEmail || p.email || '').toLowerCase().includes(query)
      );
    }

    // Only include patients with email
    filtered = filtered.filter((p) => p.patientEmail || p.email);

    return filtered;
  }, [patients, segment, searchQuery]);

  const patientsWithEmail = filteredPatients();

  // Handle template selection
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setBody(template.body);
    if (!campaignName && template.name !== 'Personalizado') {
      setCampaignName(`Campanha ${template.name} - ${format(new Date(), 'dd/MM/yyyy')}`);
    }
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPatients(patientsWithEmail.map((p) => p.id));
    } else {
      setSelectedPatients([]);
    }
  };

  // Handle individual patient selection
  const handleSelectPatient = (patientId, checked) => {
    if (checked) {
      setSelectedPatients((prev) => [...prev, patientId]);
    } else {
      setSelectedPatients((prev) => prev.filter((id) => id !== patientId));
    }
  };

  // Create and send campaign
  const handleCreateCampaign = async (sendNow = true) => {
    if (selectedPatients.length === 0) {
      onError?.('Selecione pelo menos um paciente');
      return;
    }

    if (!subject.trim() || !body.trim()) {
      onError?.('Preencha o assunto e o corpo do email');
      return;
    }

    const name = campaignName.trim() || `Campanha ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;

    setConfirmOpen(false);
    setScheduleOpen(false);
    setCreating(true);

    try {
      // Prepare recipients
      const selectedPatientsData = patientsWithEmail.filter((p) =>
        selectedPatients.includes(p.id)
      );

      const recipients = selectedPatientsData.map((p) => ({
        email: p.patientEmail || p.email,
        name: p.patientName || p.name || null,
      }));

      // Create campaign
      const campaign = await emailCampaignService.createCampaign({
        name,
        subject,
        body,
        templateId: selectedTemplate?.id || null,
        sourceType: CampaignSourceType.MANUAL,
        recipients,
        dailyLimit: 500,
        batchSize: 50,
        batchIntervalSecs: 60,
      });

      if (sendNow) {
        // Send immediately
        await emailCampaignService.sendCampaign(campaign.id);
        onSuccess?.(`Campanha "${name}" iniciada! ${recipients.length} email(s) sendo enviados.`);
      } else if (scheduledDate && scheduledTime) {
        // Schedule for later
        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
        await emailCampaignService.scheduleCampaign(campaign.id, scheduledAt);
        onSuccess?.(`Campanha "${name}" agendada para ${format(scheduledAt, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}`);
      } else {
        onSuccess?.(`Campanha "${name}" criada como rascunho.`);
      }

      // Reset form
      setSelectedPatients([]);
      setCampaignName('');
      setSubject('');
      setBody('');
      setSelectedTemplate(null);
      setScheduledDate('');
      setScheduledTime('');

      // Refresh campaigns list
      loadCampaigns();

      // Switch to campaigns tab
      setActiveTab(1);
    } catch (err) {
      onError?.(err.message || 'Erro ao criar campanha');
    } finally {
      setCreating(false);
    }
  };

  // Campaign actions
  const handlePauseCampaign = async (campaignId) => {
    try {
      await emailCampaignService.pauseCampaign(campaignId);
      onSuccess?.('Campanha pausada');
      loadCampaigns();
    } catch (err) {
      onError?.(err.message || 'Erro ao pausar campanha');
    }
  };

  const handleResumeCampaign = async (campaignId) => {
    try {
      await emailCampaignService.resumeCampaign(campaignId);
      onSuccess?.('Campanha retomada');
      loadCampaigns();
    } catch (err) {
      onError?.(err.message || 'Erro ao retomar campanha');
    }
  };

  const handleCancelCampaign = async (campaignId) => {
    try {
      await emailCampaignService.cancelCampaign(campaignId);
      onSuccess?.('Campanha cancelada');
      loadCampaigns();
    } catch (err) {
      onError?.(err.message || 'Erro ao cancelar campanha');
    }
  };

  const handleSendCampaign = async (campaignId) => {
    try {
      await emailCampaignService.sendCampaign(campaignId);
      onSuccess?.('Campanha iniciada');
      loadCampaigns();
    } catch (err) {
      onError?.(err.message || 'Erro ao iniciar campanha');
    }
  };

  // View campaign details
  const handleViewCampaign = async (campaign) => {
    setSelectedCampaign(campaign);
    setCampaignDetailsOpen(true);
  };

  // Get preview content
  const getPreviewContent = () => {
    const sampleName = selectedPatients.length > 0
      ? (patientsWithEmail.find((p) => p.id === selectedPatients[0])?.patientName || 'Paciente')
      : 'Paciente Exemplo';

    return {
      subject: subject.replace(/\{\{nome\}\}/gi, sampleName),
      body: body
        .replace(/\{\{nome\}\}/gi, sampleName)
        .replace(/\{\{medico\}\}/gi, 'Dr(a). Equipe Medica'),
    };
  };

  // Render campaign status chip
  const renderStatusChip = (status) => {
    const label = CampaignStatusLabels[status] || status;
    const color = CampaignStatusColors[status] || 'default';
    return <Chip label={label} size="small" color={color} />;
  };

  // Render campaign actions
  const renderCampaignActions = (campaign) => {
    const actions = [];

    if (canStartCampaign(campaign.status)) {
      actions.push(
        <Tooltip key="start" title="Iniciar envio">
          <IconButton size="small" onClick={() => handleSendCampaign(campaign.id)}>
            <Play className="w-4 h-4 text-green-600" />
          </IconButton>
        </Tooltip>
      );
    }

    if (canPauseCampaign(campaign.status)) {
      actions.push(
        <Tooltip key="pause" title="Pausar">
          <IconButton size="small" onClick={() => handlePauseCampaign(campaign.id)}>
            <Pause className="w-4 h-4 text-amber-600" />
          </IconButton>
        </Tooltip>
      );
    }

    if (canResumeCampaign(campaign.status)) {
      actions.push(
        <Tooltip key="resume" title="Retomar">
          <IconButton size="small" onClick={() => handleResumeCampaign(campaign.id)}>
            <Play className="w-4 h-4 text-green-600" />
          </IconButton>
        </Tooltip>
      );
    }

    if (canCancelCampaign(campaign.status)) {
      actions.push(
        <Tooltip key="cancel" title="Cancelar">
          <IconButton size="small" onClick={() => handleCancelCampaign(campaign.id)}>
            <Square className="w-4 h-4 text-red-600" />
          </IconButton>
        </Tooltip>
      );
    }

    actions.push(
      <Tooltip key="view" title="Ver detalhes">
        <IconButton size="small" onClick={() => handleViewCampaign(campaign)}>
          <BarChart3 className="w-4 h-4 text-slate-600" />
        </IconButton>
      </Tooltip>
    );

    return actions;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Campanha de Email
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Envie emails personalizados para seus pacientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            icon={<Users className="w-4 h-4" />}
            label={`${patientsWithEmail.length} com email`}
            size="small"
            className="bg-slate-100"
          />
          {selectedPatients.length > 0 && activeTab === 0 && (
            <Chip
              icon={<UserCheck className="w-4 h-4" />}
              label={`${selectedPatients.length} selecionados`}
              size="small"
              color="primary"
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab
          icon={<Plus className="w-4 h-4" />}
          iconPosition="start"
          label="Nova Campanha"
          sx={{ textTransform: 'none' }}
        />
        <Tab
          icon={<List className="w-4 h-4" />}
          iconPosition="start"
          label={`Campanhas${campaigns.length > 0 ? ` (${campaigns.length})` : ''}`}
          sx={{ textTransform: 'none' }}
        />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 ? (
        /* New Campaign Tab */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Email Configuration */}
          <div className="space-y-6">
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Escolha um Template
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {EMAIL_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                        selectedTemplate?.id === template.id
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          template.bgColor
                        )}
                      >
                        <template.icon className={cn('w-5 h-5', template.color)} />
                      </div>
                      <span className="font-medium text-sm text-slate-700">
                        {template.name}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Email Content */}
            <Card>
              <CardHeader>
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Conteudo do Email
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <TextField
                  fullWidth
                  label="Nome da Campanha"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Ex: Campanha de Retorno Janeiro 2026"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Assunto"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Digite o assunto do email..."
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                    },
                  }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  label="Mensagem"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Digite a mensagem do email..."
                  helperText="Use {{nome}} para o nome do paciente e {{medico}} para o nome do medico"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                    },
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outlined"
                    startIcon={<Eye className="w-4 h-4" />}
                    onClick={() => setPreviewOpen(true)}
                    disabled={!subject || !body}
                    sx={{ borderRadius: '10px', textTransform: 'none' }}
                  >
                    Visualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Patient Selection */}
          <div className="space-y-6">
            {/* Segment Filter */}
            <Card>
              <CardHeader>
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  Segmento de Pacientes
                </h3>
              </CardHeader>
              <CardContent>
                <FormControl fullWidth size="small">
                  <Select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    sx={{ borderRadius: '10px' }}
                  >
                    {SEGMENT_FILTERS.map((filter) => (
                      <MenuItem key={filter.id} value={filter.id}>
                        <div className="flex items-center gap-2">
                          <filter.icon className="w-4 h-4 text-slate-500" />
                          {filter.label}
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>

            {/* Patient List */}
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  Destinatarios
                </h3>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={
                        selectedPatients.length === patientsWithEmail.length &&
                        patientsWithEmail.length > 0
                      }
                      indeterminate={
                        selectedPatients.length > 0 &&
                        selectedPatients.length < patientsWithEmail.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  }
                  label={
                    <span className="text-sm text-slate-600">Selecionar todos</span>
                  }
                />
              </CardHeader>
              <CardContent className="p-0">
                {/* Search */}
                <div className="px-5 pb-4">
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar paciente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search className="w-4 h-4 text-slate-400" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                      },
                    }}
                  />
                </div>

                {/* Patient List */}
                <div className="max-h-[400px] overflow-y-auto border-t border-slate-100">
                  {loadingPatients ? (
                    <div className="flex items-center justify-center py-8">
                      <CircularProgress size={24} />
                    </div>
                  ) : patientsWithEmail.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum paciente com email encontrado</p>
                    </div>
                  ) : (
                    patientsWithEmail.map((patient) => (
                      <div
                        key={patient.id}
                        className={cn(
                          'flex items-center gap-3 px-5 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors',
                          selectedPatients.includes(patient.id) && 'bg-primary/5'
                        )}
                      >
                        <Checkbox
                          size="small"
                          checked={selectedPatients.includes(patient.id)}
                          onChange={(e) =>
                            handleSelectPatient(patient.id, e.target.checked)
                          }
                        />
                        <Avatar
                          src={patient.patientPhotoUrl}
                          sx={{ width: 36, height: 36 }}
                        >
                          {(patient.patientName || patient.name || 'P')[0]}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 truncate">
                            {patient.patientName || patient.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {patient.patientEmail || patient.email}
                          </p>
                        </div>
                        {patient.lastConsultationDate && (
                          <span className="text-xs text-slate-400">
                            {format(
                              new Date(patient.lastConsultationDate),
                              'dd/MM/yy',
                              { locale: ptBR }
                            )}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Send Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outlined"
                size="large"
                startIcon={<Calendar className="w-5 h-5" />}
                onClick={() => setScheduleOpen(true)}
                disabled={
                  creating ||
                  selectedPatients.length === 0 ||
                  !subject.trim() ||
                  !body.trim()
                }
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                  flex: 1,
                }}
              >
                Agendar
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={
                  creating ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )
                }
                onClick={() => setConfirmOpen(true)}
                disabled={
                  creating ||
                  selectedPatients.length === 0 ||
                  !subject.trim() ||
                  !body.trim()
                }
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px 0 rgba(24, 82, 254, 0.25)',
                  flex: 2,
                }}
              >
                {creating
                  ? 'Criando...'
                  : `Enviar para ${selectedPatients.length} paciente(s)`}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Campaigns List Tab */
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="font-medium text-slate-900 flex items-center gap-2">
              <List className="w-4 h-4 text-slate-500" />
              Campanhas Recentes
            </h3>
            <Button
              size="small"
              startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshCw className="w-4 h-4" />}
              onClick={() => {
                setRefreshing(true);
                loadCampaigns().finally(() => setRefreshing(false));
              }}
              disabled={refreshing || loadingCampaigns}
              sx={{ textTransform: 'none' }}
            >
              Atualizar
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loadingCampaigns ? (
              <div className="flex items-center justify-center py-12">
                <CircularProgress size={32} />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhuma campanha ainda</p>
                <p className="text-sm mt-1">Crie sua primeira campanha na aba "Nova Campanha"</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {campaigns.map((campaign) => {
                  const metrics = formatCampaignMetrics(campaign);
                  return (
                    <div
                      key={campaign.id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm text-slate-900 truncate">
                            {campaign.name}
                          </p>
                          {renderStatusChip(campaign.status)}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {campaign.subject}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {metrics.totalRecipients} destinatarios
                          </span>
                          {campaign.status === CampaignStatus.SENDING && (
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              {metrics.progress}% enviado
                            </span>
                          )}
                          {metrics.openRate > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {metrics.openRate}% abertos
                            </span>
                          )}
                        </div>
                        {campaign.status === CampaignStatus.SENDING && (
                          <LinearProgress
                            variant="determinate"
                            value={metrics.progress}
                            sx={{ mt: 1, borderRadius: 1, height: 4 }}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {renderCampaignActions(campaign)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' },
        }}
      >
        <DialogTitle className="flex items-center justify-between">
          <span className="font-semibold">Preview do Email</span>
          <IconButton
            onClick={() => setPreviewOpen(false)}
            size="small"
          >
            <X className="w-4 h-4" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Assunto:</p>
              <p className="font-medium text-slate-900">
                {getPreviewContent().subject}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Mensagem:</p>
              <div className="bg-slate-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-slate-700">
                {getPreviewContent().body}
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setPreviewOpen(false)}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' },
        }}
      >
        <DialogTitle className="font-semibold">
          Confirmar Envio
        </DialogTitle>
        <DialogContent>
          <p className="text-slate-600">
            Voce esta prestes a enviar emails para{' '}
            <strong>{selectedPatients.length}</strong> paciente(s).
          </p>
          <Alert severity="info" sx={{ mt: 2 }}>
            Os emails serao enviados em lotes para evitar bloqueio pelo servidor.
            Voce pode acompanhar o progresso na aba "Campanhas".
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => handleCreateCampaign(true)}
            startIcon={<Send className="w-4 h-4" />}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Confirmar Envio
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' },
        }}
      >
        <DialogTitle className="font-semibold">
          Agendar Campanha
        </DialogTitle>
        <DialogContent>
          <p className="text-slate-600 mb-4">
            Agende o envio para <strong>{selectedPatients.length}</strong> paciente(s).
          </p>
          <div className="space-y-4">
            <TextField
              fullWidth
              label="Data"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: format(new Date(), 'yyyy-MM-dd') }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                },
              }}
            />
            <TextField
              fullWidth
              label="Hora"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                },
              }}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setScheduleOpen(false)}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => handleCreateCampaign(false)}
            disabled={!scheduledDate || !scheduledTime}
            startIcon={<Calendar className="w-4 h-4" />}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Agendar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Campaign Details Dialog */}
      <Dialog
        open={campaignDetailsOpen}
        onClose={() => setCampaignDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' },
        }}
      >
        {selectedCampaign && (
          <>
            <DialogTitle className="flex items-center justify-between">
              <span className="font-semibold">{selectedCampaign.name}</span>
              <IconButton
                onClick={() => setCampaignDetailsOpen(false)}
                size="small"
              >
                <X className="w-4 h-4" />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Status:</span>
                  {renderStatusChip(selectedCampaign.status)}
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">Assunto:</p>
                  <p className="text-sm text-slate-900">{selectedCampaign.subject}</p>
                </div>

                {(() => {
                  const metrics = formatCampaignMetrics(selectedCampaign);
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">Total</p>
                        <p className="text-xl font-semibold text-slate-900">
                          {metrics.totalRecipients}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-600">Enviados</p>
                        <p className="text-xl font-semibold text-green-700">
                          {metrics.sentCount}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600">Abertos</p>
                        <p className="text-xl font-semibold text-blue-700">
                          {metrics.openedCount} ({metrics.openRate}%)
                        </p>
                      </div>
                      <div className="bg-violet-50 rounded-lg p-3">
                        <p className="text-xs text-violet-600">Clicados</p>
                        <p className="text-xl font-semibold text-violet-700">
                          {metrics.clickedCount} ({metrics.clickRate}%)
                        </p>
                      </div>
                      {metrics.failedCount > 0 && (
                        <div className="bg-red-50 rounded-lg p-3 col-span-2">
                          <p className="text-xs text-red-600">Falhas</p>
                          <p className="text-xl font-semibold text-red-700">
                            {metrics.failedCount} ({metrics.failRate}%)
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {selectedCampaign.scheduled_at && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Agendado para:</p>
                    <p className="text-sm text-slate-900">
                      {format(new Date(selectedCampaign.scheduled_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-500 mb-1">Criado em:</p>
                  <p className="text-sm text-slate-900">
                    {format(new Date(selectedCampaign.created_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={() => setCampaignDetailsOpen(false)}
                sx={{ borderRadius: '10px', textTransform: 'none' }}
              >
                Fechar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}
