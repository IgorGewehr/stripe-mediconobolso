'use client';

/**
 * @fileoverview WhatsApp Campaign Section - Mass WhatsApp Messaging
 * @description Component for configuring and sending mass WhatsApp messages to patients
 * Supports importing contacts from Excel/CSV files
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  MessageSquare,
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
  UserCheck,
  CalendarDays,
  Activity,
  Play,
  Pause,
  Square,
  RefreshCw,
  BarChart3,
  Calendar,
  List,
  Plus,
  Image,
  FileIcon,
  Phone,
  Upload,
  FileSpreadsheet,
  Trash2,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePatients } from '../../hooks';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import whatsappCampaignService, {
  CampaignStatus,
  CampaignStatusLabels,
  CampaignStatusColors,
  CampaignSourceType,
  formatCampaignMetrics,
  canStartCampaign,
  canPauseCampaign,
  canResumeCampaign,
  canCancelCampaign,
  formatPhoneNumber,
  isValidWhatsAppNumber,
  normalizePhoneNumber,
  getTemplateVariables,
} from '@/lib/services/api/whatsappCampaign.service';

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
// Message Templates
// ============================================================================

const MESSAGE_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Boas-vindas',
    icon: Sparkles,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    message: `Ola {{nome}}!

Seja muito bem-vindo(a) ao nosso consultorio! Estamos felizes em te-lo(a) como paciente.

Qualquer duvida, estamos a disposicao.

Abracos,
{{medico}}`,
  },
  {
    id: 'reminder',
    name: 'Lembrete de Retorno',
    icon: CalendarDays,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    message: `Ola {{nome}}!

Notamos que ja faz um tempo desde sua ultima consulta.

Que tal agendar seu retorno? Manter o acompanhamento regular e fundamental para sua saude.

Entre em contato conosco para agendar!

{{medico}}`,
  },
  {
    id: 'checkup',
    name: 'Check-up Anual',
    icon: Activity,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    message: `Ola {{nome}}!

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
    message: '',
  },
];

// ============================================================================
// Source Options
// ============================================================================

const SOURCE_OPTIONS = [
  { id: 'patients', label: 'Pacientes do Sistema', icon: Users },
  { id: 'import', label: 'Importar Excel/CSV', icon: FileSpreadsheet },
];

// ============================================================================
// Selection Limit Options
// ============================================================================

const SELECTION_LIMITS = [
  { value: 'all', label: 'Todos' },
  { value: '50', label: 'Primeiros 50' },
  { value: '100', label: 'Primeiros 100' },
  { value: '200', label: 'Primeiros 200' },
  { value: '500', label: 'Primeiros 500' },
  { value: '1000', label: 'Primeiros 1000' },
  { value: 'custom', label: 'Personalizado' },
];

// ============================================================================
// Segment Filters (for patients)
// ============================================================================

const SEGMENT_FILTERS = [
  { id: 'all', label: 'Todos os Pacientes', icon: Users, filter: null },
  { id: 'inactive_30', label: 'Inativos 30+ dias', icon: Clock, filter: { inactive_days: 30 } },
  { id: 'inactive_90', label: 'Inativos 90+ dias', icon: AlertCircle, filter: { inactive_days: 90 } },
  { id: 'recent', label: 'Ultimas consultas (7 dias)', icon: CheckCircle2, filter: { recent_days: 7 } },
];

// ============================================================================
// Excel Parser Helper
// ============================================================================

function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) {
          reject(new Error('Arquivo vazio'));
          return;
        }

        // Get headers (first row)
        const headers = jsonData[0].map(h => String(h || '').toLowerCase().trim());

        // Find phone and name columns
        const phoneColIndex = headers.findIndex(h =>
          h.includes('telefone') || h.includes('phone') || h.includes('whatsapp') ||
          h.includes('celular') || h.includes('fone') || h.includes('numero')
        );
        const nameColIndex = headers.findIndex(h =>
          h.includes('nome') || h.includes('name') || h.includes('paciente') || h.includes('cliente')
        );

        if (phoneColIndex === -1) {
          // Try to find a column with phone-like data
          const firstDataRow = jsonData[1];
          const possiblePhoneCol = firstDataRow?.findIndex(cell => {
            const str = String(cell || '').replace(/\D/g, '');
            return str.length >= 10 && str.length <= 13;
          });
          if (possiblePhoneCol === -1) {
            reject(new Error('Coluna de telefone nao encontrada. Certifique-se que o arquivo tem uma coluna com "telefone", "phone", "whatsapp" ou "celular".'));
            return;
          }
        }

        // Parse contacts
        const contacts = [];
        const errors = [];
        const seenPhones = new Set();

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const phoneRaw = String(row[phoneColIndex !== -1 ? phoneColIndex : 0] || '').trim();
          const name = nameColIndex !== -1 ? String(row[nameColIndex] || '').trim() : '';

          // Clean phone number
          let phone = phoneRaw.replace(/\D/g, '');

          // Add Brazil code if needed
          if (phone.length === 10 || phone.length === 11) {
            phone = '55' + phone;
          }

          // Validate
          if (phone.length < 12 || phone.length > 13) {
            errors.push({ row: i + 1, phone: phoneRaw, reason: 'Numero invalido' });
            continue;
          }

          if (seenPhones.has(phone)) {
            errors.push({ row: i + 1, phone: phoneRaw, reason: 'Duplicado' });
            continue;
          }

          seenPhones.add(phone);
          contacts.push({
            id: `import-${i}`,
            phone,
            phoneDisplay: phoneRaw,
            name: name || `Contato ${i}`,
            row: i + 1,
          });
        }

        resolve({
          contacts,
          errors,
          headers: jsonData[0],
          totalRows: jsonData.length - 1,
        });
      } catch (err) {
        reject(new Error('Erro ao processar arquivo: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

// ============================================================================
// Campaign Details Modal Component (Real-time updates)
// ============================================================================

function CampaignDetailsModal({
  open,
  campaign,
  onClose,
  onPause,
  onResume,
  onCancel,
  onStart,
  renderStatusChip,
}) {
  const [localCampaign, setLocalCampaign] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Update local campaign when prop changes
  useEffect(() => {
    if (campaign) {
      setLocalCampaign(campaign);
    }
  }, [campaign]);

  // Auto-refresh when modal is open and campaign is sending
  useEffect(() => {
    if (!open || !localCampaign) return;

    const isSending = localCampaign.status === CampaignStatus.SENDING;
    if (!isSending) return;

    const refreshData = async () => {
      try {
        const updated = await whatsappCampaignService.getCampaign(localCampaign.id);
        setLocalCampaign(updated);
      } catch (err) {
        console.error('Error refreshing campaign:', err);
      }
    };

    // Refresh every 3 seconds while sending
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [open, localCampaign?.id, localCampaign?.status]);

  // Load recipients when modal opens
  useEffect(() => {
    if (open && localCampaign?.id) {
      loadRecipients();
    }
  }, [open, localCampaign?.id]);

  const loadRecipients = async () => {
    if (!localCampaign) return;
    setLoadingRecipients(true);
    try {
      const result = await whatsappCampaignService.listRecipients(localCampaign.id, { perPage: 100 });
      setRecipients(result.items || []);
    } catch (err) {
      console.error('Error loading recipients:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const updated = await whatsappCampaignService.getCampaign(localCampaign.id);
      setLocalCampaign(updated);
      await loadRecipients();
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (!localCampaign) return null;

  const metrics = formatCampaignMetrics(localCampaign);
  const isSending = localCampaign.status === CampaignStatus.SENDING;
  const isPaused = localCampaign.status === CampaignStatus.PAUSED;
  const isDraft = localCampaign.status === CampaignStatus.DRAFT;

  // Get recipient status counts
  const recipientStats = recipients.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px', maxHeight: '90vh' },
      }}
    >
      <DialogTitle className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            isSending ? 'bg-amber-100' : isPaused ? 'bg-slate-100' : 'bg-green-100'
          )}>
            {isSending ? (
              <Activity className="w-5 h-5 text-amber-600 animate-pulse" />
            ) : isPaused ? (
              <Pause className="w-5 h-5 text-slate-600" />
            ) : (
              <MessageSquare className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{localCampaign.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {renderStatusChip(localCampaign.status)}
              {isSending && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Atualizando...
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </IconButton>
          <IconButton onClick={onClose} size="small">
            <X className="w-4 h-4" />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Progress Bar for Sending Campaigns */}
        {(isSending || isPaused) && (
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Progresso: {metrics.sentCount} de {metrics.totalRecipients}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {metrics.progress}%
              </span>
            </div>
            <LinearProgress
              variant="determinate"
              value={metrics.progress}
              color={isPaused ? 'inherit' : 'success'}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  transition: 'transform 0.5s ease-in-out',
                },
              }}
            />
            {isPaused && localCampaign.error_message && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {localCampaign.error_message}
              </Alert>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Metricas" sx={{ textTransform: 'none' }} />
          <Tab
            label={`Destinatarios (${recipients.length})`}
            sx={{ textTransform: 'none' }}
          />
          <Tab label="Mensagem" sx={{ textTransform: 'none' }} />
        </Tabs>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 0 && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">Total</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {metrics.totalRecipients}
                  </p>
                  <Users className="w-5 h-5 mx-auto mt-2 text-slate-400" />
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-green-600 mb-1">Enviados</p>
                  <p className="text-2xl font-bold text-green-700">
                    {metrics.sentCount}
                  </p>
                  <Send className="w-5 h-5 mx-auto mt-2 text-green-500" />
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-blue-600 mb-1">Entregues</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {metrics.deliveredCount}
                  </p>
                  <span className="text-xs text-blue-500">{metrics.deliveryRate}%</span>
                </div>
                <div className="bg-violet-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-violet-600 mb-1">Lidos</p>
                  <p className="text-2xl font-bold text-violet-700">
                    {metrics.readCount}
                  </p>
                  <span className="text-xs text-violet-500">{metrics.readRate}%</span>
                </div>
              </div>

              {/* Failed Count if any */}
              {metrics.failedCount > 0 && (
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700">
                        Falhas no envio
                      </p>
                      <p className="text-xs text-red-500 mt-1">
                        {metrics.failedCount} mensagens falharam ({metrics.failRate}%)
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-red-700">
                      {metrics.failedCount}
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Criado em</p>
                  <p className="font-medium text-slate-900">
                    {format(new Date(localCampaign.created_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {localCampaign.started_at && (
                  <div>
                    <p className="text-slate-500">Iniciado em</p>
                    <p className="font-medium text-slate-900">
                      {format(new Date(localCampaign.started_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {localCampaign.scheduled_at && (
                  <div>
                    <p className="text-slate-500">Agendado para</p>
                    <p className="font-medium text-slate-900">
                      {format(new Date(localCampaign.scheduled_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
                {localCampaign.completed_at && (
                  <div>
                    <p className="text-slate-500">Concluido em</p>
                    <p className="font-medium text-slate-900">
                      {format(new Date(localCampaign.completed_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div>
              {loadingRecipients ? (
                <div className="flex items-center justify-center py-12">
                  <CircularProgress size={32} />
                </div>
              ) : recipients.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Nenhum destinatario encontrado</p>
                </div>
              ) : (
                <>
                  {/* Status Summary */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(recipientStats).map(([status, count]) => (
                      <Chip
                        key={status}
                        label={`${status}: ${count}`}
                        size="small"
                        variant="outlined"
                        color={
                          status === 'sent' || status === 'delivered' || status === 'read'
                            ? 'success'
                            : status === 'failed'
                            ? 'error'
                            : 'default'
                        }
                      />
                    ))}
                  </div>

                  {/* Recipients List */}
                  <div className="max-h-[300px] overflow-y-auto border border-slate-200 rounded-lg">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'slate.50' }}>
                          <TableCell>Contato</TableCell>
                          <TableCell>Telefone</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Atualizado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recipients.map((recipient) => (
                          <TableRow key={recipient.id} hover>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                                  {(recipient.name || recipient.phone)?.[0]?.toUpperCase()}
                                </Avatar>
                                <span className="text-sm">
                                  {recipient.name || 'Sem nome'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {formatPhoneNumber(recipient.phone)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={recipient.status}
                                size="small"
                                color={
                                  recipient.status === 'sent' ||
                                  recipient.status === 'delivered' ||
                                  recipient.status === 'read'
                                    ? 'success'
                                    : recipient.status === 'failed'
                                    ? 'error'
                                    : 'default'
                                }
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {recipient.updated_at
                                ? format(new Date(recipient.updated_at), 'HH:mm:ss')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 2 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Mensagem da campanha:</p>
              <div className="bg-[#e5ddd5] rounded-lg p-4">
                <div className="bg-[#dcf8c6] rounded-lg p-3 max-w-[80%] ml-auto shadow">
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">
                    {localCampaign.message_template || localCampaign.message}
                  </p>
                </div>
              </div>
              {localCampaign.media_url && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Midia anexada:</p>
                  <div className="flex items-center gap-2">
                    {localCampaign.media_type === 'image' ? (
                      <Image className="w-4 h-4 text-blue-500" />
                    ) : (
                      <FileIcon className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-sm text-slate-700 truncate">
                      {localCampaign.media_url}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, borderTop: 1, borderColor: 'divider' }}>
        {isDraft && (
          <Button
            variant="contained"
            color="success"
            startIcon={<Play className="w-4 h-4" />}
            onClick={() => {
              onStart(localCampaign.id);
              onClose();
            }}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Iniciar
          </Button>
        )}
        {isSending && (
          <Button
            variant="outlined"
            color="warning"
            startIcon={<Pause className="w-4 h-4" />}
            onClick={() => {
              onPause(localCampaign.id);
              onClose();
            }}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Pausar
          </Button>
        )}
        {isPaused && (
          <Button
            variant="contained"
            color="success"
            startIcon={<Play className="w-4 h-4" />}
            onClick={() => {
              onResume(localCampaign.id);
              onClose();
            }}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Retomar
          </Button>
        )}
        {canCancelCampaign(localCampaign.status) && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Square className="w-4 h-4" />}
            onClick={() => {
              onCancel(localCampaign.id);
              onClose();
            }}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Cancelar
          </Button>
        )}
        <div className="flex-1" />
        <Button
          onClick={onClose}
          sx={{ borderRadius: '10px', textTransform: 'none' }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function WhatsAppCampaignSection({ onSuccess, onError }) {
  // Tab state
  const [activeTab, setActiveTab] = useState(0); // 0 = Nova Campanha, 1 = Campanhas

  // Source selection
  const [sourceType, setSourceType] = useState('patients'); // 'patients' or 'import'

  // Campaign creation state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [campaignName, setCampaignName] = useState('');
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('none');
  const [segment, setSegment] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Import state
  const [importedContacts, setImportedContacts] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const fileInputRef = useRef(null);

  // Selection limit state
  const [selectionLimit, setSelectionLimit] = useState('all');
  const [customLimit, setCustomLimit] = useState('');

  // Campaign list state
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetailsOpen, setCampaignDetailsOpen] = useState(false);

  // Loading states
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Hooks
  const { patients, loading: loadingPatients } = usePatients({ autoLoad: true });

  // Load campaigns on mount
  useEffect(() => {
    loadCampaigns();
  }, []);

  // Auto-refresh campaigns: 5 seconds when sending, 30 seconds when scheduled
  useEffect(() => {
    const hasSendingCampaign = campaigns.some(
      (c) => c.status === CampaignStatus.SENDING
    );
    const hasScheduledCampaign = campaigns.some(
      (c) => c.status === CampaignStatus.SCHEDULED
    );

    if (hasSendingCampaign) {
      // Polling rapido durante execucao para feedback em tempo real (5 seg)
      const interval = setInterval(loadCampaigns, 5000);
      return () => clearInterval(interval);
    } else if (hasScheduledCampaign) {
      // Polling mais lento para agendadas
      const interval = setInterval(loadCampaigns, 30000);
      return () => clearInterval(interval);
    }
  }, [campaigns]);

  // Load campaigns from API
  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const result = await whatsappCampaignService.listCampaigns({ perPage: 50 });
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
          (p.patientPhone || p.phone || '').includes(query)
      );
    }

    // Only include patients with valid WhatsApp number
    filtered = filtered.filter((p) => {
      const phone = p.patientPhone || p.phone;
      return phone && isValidWhatsAppNumber(phone);
    });

    return filtered;
  }, [patients, segment, searchQuery]);

  // Get the current contact list based on source
  const currentContacts = sourceType === 'patients' ? filteredPatients() : importedContacts;

  // Apply selection limit
  const getDisplayedContacts = useCallback(() => {
    let limit = currentContacts.length;

    if (selectionLimit === 'custom' && customLimit) {
      limit = Math.min(parseInt(customLimit, 10) || currentContacts.length, currentContacts.length);
    } else if (selectionLimit !== 'all') {
      limit = Math.min(parseInt(selectionLimit, 10), currentContacts.length);
    }

    return currentContacts.slice(0, limit);
  }, [currentContacts, selectionLimit, customLimit]);

  const displayedContacts = getDisplayedContacts();

  // Handle file import
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    const isValidType = validTypes.includes(file.type) ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.csv');

    if (!isValidType) {
      onError?.('Formato invalido. Use arquivos Excel (.xlsx, .xls) ou CSV.');
      return;
    }

    setImporting(true);
    setImportFileName(file.name);

    try {
      const result = await parseExcelFile(file);
      setImportedContacts(result.contacts);
      setImportErrors(result.errors);
      setSelectedContacts(result.contacts.map(c => c.id));
      onSuccess?.(`${result.contacts.length} contatos importados de ${result.totalRows} linhas.`);
    } catch (err) {
      onError?.(err.message);
      setImportedContacts([]);
      setImportErrors([]);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Clear import
  const handleClearImport = () => {
    setImportedContacts([]);
    setImportErrors([]);
    setImportFileName('');
    setSelectedContacts([]);
  };

  // Handle template selection
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setMessage(template.message);
    if (!campaignName && template.name !== 'Personalizado') {
      setCampaignName(`WhatsApp ${template.name} - ${format(new Date(), 'dd/MM/yyyy')}`);
    }
  };

  // Handle select all displayed
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedContacts(displayedContacts.map((c) => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  // Handle individual contact selection
  const handleSelectContact = (contactId, checked) => {
    if (checked) {
      setSelectedContacts((prev) => [...prev, contactId]);
    } else {
      setSelectedContacts((prev) => prev.filter((id) => id !== contactId));
    }
  };

  // Auto-select when limit changes
  useEffect(() => {
    if (displayedContacts.length > 0) {
      setSelectedContacts(displayedContacts.map(c => c.id));
    }
  }, [selectionLimit, customLimit, sourceType, segment]);

  // Create and send campaign
  const handleCreateCampaign = async (sendNow = true) => {
    if (selectedContacts.length === 0) {
      onError?.('Selecione pelo menos um contato');
      return;
    }

    if (!message.trim()) {
      onError?.('Digite a mensagem');
      return;
    }

    const name = campaignName.trim() || `WhatsApp ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;

    setConfirmOpen(false);
    setScheduleOpen(false);
    setCreating(true);

    try {
      // Prepare recipients based on source
      let recipients;
      if (sourceType === 'patients') {
        const selectedPatientsData = displayedContacts.filter((p) =>
          selectedContacts.includes(p.id)
        );
        recipients = selectedPatientsData.map((p) => ({
          phone: normalizePhoneNumber(p.patientPhone || p.phone),
          name: p.patientName || p.name || null,
        }));
      } else {
        const selectedImportData = importedContacts.filter((c) =>
          selectedContacts.includes(c.id)
        );
        recipients = selectedImportData.map((c) => ({
          phone: c.phone,
          name: c.name || null,
        }));
      }

      // Create campaign
      const campaign = await whatsappCampaignService.createCampaign({
        name,
        message,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType !== 'none' ? mediaType : null,
        sourceType: CampaignSourceType.MANUAL,
        recipients,
        dailyLimit: 1000,
        batchSize: 20,
        batchIntervalSecs: 60,
        messageDelayMs: 3000, // 3 seconds between messages
      });

      if (sendNow) {
        // Send immediately
        await whatsappCampaignService.startCampaign(campaign.id);
        onSuccess?.(`Campanha "${name}" iniciada! ${recipients.length} mensagem(ns) sendo enviada(s).`);
      } else if (scheduledDate && scheduledTime) {
        // Schedule for later
        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
        await whatsappCampaignService.scheduleCampaign(campaign.id, scheduledAt);
        onSuccess?.(`Campanha "${name}" agendada para ${format(scheduledAt, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}`);
      } else {
        onSuccess?.(`Campanha "${name}" criada como rascunho.`);
      }

      // Reset form
      setSelectedContacts([]);
      setCampaignName('');
      setMessage('');
      setMediaUrl('');
      setMediaType('none');
      setSelectedTemplate(null);
      setScheduledDate('');
      setScheduledTime('');
      if (sourceType === 'import') {
        handleClearImport();
      }

      // Refresh campaigns list
      loadCampaigns();

      // Switch to campaigns tab
      setActiveTab(1);
    } catch (err) {
      // Tratar mensagens de erro do backend
      let errorMessage = err.message || 'Erro ao criar campanha';

      // Remover prefixo técnico se existir
      if (errorMessage.includes('Erro de validação: ')) {
        errorMessage = errorMessage.replace('Erro de validação: ', '');
      }

      onError?.(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  // Campaign actions
  const handlePauseCampaign = async (campaignId) => {
    try {
      await whatsappCampaignService.pauseCampaign(campaignId);
      onSuccess?.('Campanha pausada');
      loadCampaigns();
    } catch (err) {
      onError?.(err.message || 'Erro ao pausar campanha');
    }
  };

  const handleResumeCampaign = async (campaignId) => {
    try {
      await whatsappCampaignService.resumeCampaign(campaignId);
      onSuccess?.('Campanha retomada');
      loadCampaigns();
    } catch (err) {
      onError?.(err.message || 'Erro ao retomar campanha');
    }
  };

  const handleCancelCampaign = async (campaignId) => {
    try {
      await whatsappCampaignService.cancelCampaign(campaignId);
      onSuccess?.('Campanha cancelada');
      loadCampaigns();
    } catch (err) {
      onError?.(err.message || 'Erro ao cancelar campanha');
    }
  };

  const handleStartCampaign = async (campaignId) => {
    try {
      const result = await whatsappCampaignService.startCampaign(campaignId);
      onSuccess?.(result?.message || 'Campanha iniciada com sucesso!');
      loadCampaigns();
    } catch (err) {
      // Tratar mensagens de erro do backend
      let errorMessage = err.message || 'Erro ao iniciar campanha';

      // Remover prefixo técnico se existir
      if (errorMessage.includes('Erro de validação: ')) {
        errorMessage = errorMessage.replace('Erro de validação: ', '');
      }

      onError?.(errorMessage);
    }
  };

  // View campaign details
  const handleViewCampaign = async (campaign) => {
    setSelectedCampaign(campaign);
    setCampaignDetailsOpen(true);
  };

  // Get preview content
  const getPreviewContent = () => {
    const sampleName = selectedContacts.length > 0
      ? (displayedContacts.find((c) => c.id === selectedContacts[0])?.name ||
         displayedContacts.find((c) => c.id === selectedContacts[0])?.patientName ||
         'Paciente')
      : 'Paciente Exemplo';

    return message
      .replace(/\{\{nome\}\}/gi, sampleName)
      .replace(/\{\{medico\}\}/gi, 'Dr(a). Equipe Medica')
      .replace(/\{\{clinica\}\}/gi, 'Clinica');
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
          <IconButton size="small" onClick={() => handleStartCampaign(campaign.id)}>
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
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Campanha WhatsApp
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Envie mensagens em massa para seus pacientes ou contatos importados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip
            icon={<Phone className="w-4 h-4" />}
            label={`${displayedContacts.length} contatos`}
            size="small"
            className="bg-green-100 text-green-800"
          />
          {selectedContacts.length > 0 && activeTab === 0 && (
            <Chip
              icon={<UserCheck className="w-4 h-4" />}
              label={`${selectedContacts.length} selecionados`}
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
          {/* Left Column - Message Configuration */}
          <div className="space-y-6">
            {/* Source Selection */}
            <Card>
              <CardHeader>
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  Origem dos Contatos
                </h3>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {SOURCE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSourceType(option.id);
                        setSelectedContacts([]);
                      }}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                        sourceType === option.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          sourceType === option.id ? 'bg-green-100' : 'bg-slate-100'
                        )}
                      >
                        <option.icon className={cn(
                          'w-5 h-5',
                          sourceType === option.id ? 'text-green-600' : 'text-slate-500'
                        )} />
                      </div>
                      <span className="font-medium text-sm text-slate-700">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Import Section */}
                {sourceType === 'import' && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    {importedContacts.length === 0 ? (
                      <div className="text-center">
                        <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                        <p className="text-sm text-slate-600 mb-3">
                          Importe um arquivo Excel ou CSV com os contatos
                        </p>
                        <p className="text-xs text-slate-400 mb-4">
                          O arquivo deve ter colunas: Nome, Telefone/WhatsApp
                        </p>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <Upload className="w-4 h-4" />}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={importing}
                          sx={{ borderRadius: '10px', textTransform: 'none' }}
                        >
                          {importing ? 'Importando...' : 'Selecionar Arquivo'}
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-sm text-slate-700">{importFileName}</span>
                          </div>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<Trash2 className="w-4 h-4" />}
                            onClick={handleClearImport}
                            sx={{ textTransform: 'none' }}
                          >
                            Remover
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-green-600">
                            <CheckCircle2 className="w-4 h-4 inline mr-1" />
                            {importedContacts.length} validos
                          </span>
                          {importErrors.length > 0 && (
                            <span className="text-amber-600">
                              <AlertCircle className="w-4 h-4 inline mr-1" />
                              {importErrors.length} com erro
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

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
                  {MESSAGE_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                        selectedTemplate?.id === template.id
                          ? 'border-green-500 bg-green-50'
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

            {/* Message Content */}
            <Card>
              <CardHeader>
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  Conteudo da Mensagem
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
                  multiline
                  rows={6}
                  label="Mensagem"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite a mensagem..."
                  helperText="Use {{nome}} para o nome do contato e {{medico}} para o nome do medico"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                    },
                  }}
                />

                {/* Media Options */}
                <div className="grid grid-cols-2 gap-4">
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de Midia</InputLabel>
                    <Select
                      value={mediaType}
                      label="Tipo de Midia"
                      onChange={(e) => setMediaType(e.target.value)}
                      sx={{ borderRadius: '10px' }}
                    >
                      <MenuItem value="none">
                        <div className="flex items-center gap-2">
                          <X className="w-4 h-4 text-slate-500" />
                          Sem midia
                        </div>
                      </MenuItem>
                      <MenuItem value="image">
                        <div className="flex items-center gap-2">
                          <Image className="w-4 h-4 text-blue-500" />
                          Imagem
                        </div>
                      </MenuItem>
                      <MenuItem value="document">
                        <div className="flex items-center gap-2">
                          <FileIcon className="w-4 h-4 text-amber-500" />
                          Documento
                        </div>
                      </MenuItem>
                    </Select>
                  </FormControl>
                  {mediaType !== 'none' && (
                    <TextField
                      fullWidth
                      label="URL da Midia"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://..."
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                        },
                      }}
                    />
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outlined"
                    startIcon={<Eye className="w-4 h-4" />}
                    onClick={() => setPreviewOpen(true)}
                    disabled={!message}
                    sx={{ borderRadius: '10px', textTransform: 'none' }}
                  >
                    Visualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact Selection */}
          <div className="space-y-6">
            {/* Segment Filter (only for patients) */}
            {sourceType === 'patients' && (
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
            )}

            {/* Selection Limit */}
            <Card>
              <CardHeader>
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  Quantidade de Contatos
                </h3>
              </CardHeader>
              <CardContent>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectionLimit}
                    onChange={(e) => setSelectionLimit(e.target.value)}
                    sx={{ borderRadius: '10px' }}
                  >
                    {SELECTION_LIMITS.map((limit) => (
                      <MenuItem key={limit.value} value={limit.value}>
                        {limit.label}
                        {limit.value !== 'all' && limit.value !== 'custom' && (
                          <span className="ml-2 text-slate-400">
                            ({Math.min(parseInt(limit.value), currentContacts.length)} disponiveis)
                          </span>
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectionLimit === 'custom' && (
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantidade"
                    value={customLimit}
                    onChange={(e) => setCustomLimit(e.target.value)}
                    placeholder={`Max: ${currentContacts.length}`}
                    size="small"
                    sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                    inputProps={{ min: 1, max: currentContacts.length }}
                  />
                )}
                <p className="text-xs text-slate-500 mt-2">
                  Total disponivel: {currentContacts.length} contatos
                </p>
              </CardContent>
            </Card>

            {/* Contact List */}
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <h3 className="font-medium text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  Destinatarios ({displayedContacts.length})
                </h3>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={
                        selectedContacts.length === displayedContacts.length &&
                        displayedContacts.length > 0
                      }
                      indeterminate={
                        selectedContacts.length > 0 &&
                        selectedContacts.length < displayedContacts.length
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
                    placeholder="Buscar contato..."
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

                {/* Contact List */}
                <div className="max-h-[400px] overflow-y-auto border-t border-slate-100">
                  {(sourceType === 'patients' ? loadingPatients : importing) ? (
                    <div className="flex items-center justify-center py-8">
                      <CircularProgress size={24} />
                    </div>
                  ) : displayedContacts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>
                        {sourceType === 'import'
                          ? 'Importe um arquivo para ver os contatos'
                          : 'Nenhum paciente com WhatsApp encontrado'}
                      </p>
                    </div>
                  ) : (
                    displayedContacts.map((contact) => {
                      const name = contact.patientName || contact.name || 'Sem nome';
                      const phone = contact.patientPhone || contact.phone || contact.phoneDisplay;
                      return (
                        <div
                          key={contact.id}
                          className={cn(
                            'flex items-center gap-3 px-5 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors',
                            selectedContacts.includes(contact.id) && 'bg-green-50/50'
                          )}
                        >
                          <Checkbox
                            size="small"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={(e) =>
                              handleSelectContact(contact.id, e.target.checked)
                            }
                          />
                          <Avatar
                            src={contact.patientPhotoUrl}
                            sx={{ width: 36, height: 36, bgcolor: 'green.100' }}
                          >
                            {name[0]?.toUpperCase()}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900 truncate">
                              {name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {formatPhoneNumber(phone)}
                            </p>
                          </div>
                          {contact.lastConsultationDate && (
                            <span className="text-xs text-slate-400">
                              {format(
                                new Date(contact.lastConsultationDate),
                                'dd/MM/yy',
                                { locale: ptBR }
                              )}
                            </span>
                          )}
                          {contact.row && (
                            <span className="text-xs text-slate-400">
                              Linha {contact.row}
                            </span>
                          )}
                        </div>
                      );
                    })
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
                  selectedContacts.length === 0 ||
                  !message.trim()
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
                color="success"
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
                  selectedContacts.length === 0 ||
                  !message.trim()
                }
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px 0 rgba(34, 197, 94, 0.25)',
                  flex: 2,
                }}
              >
                {creating
                  ? 'Criando...'
                  : `Enviar para ${selectedContacts.length} contato(s)`}
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
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
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
                          {campaign.message?.substring(0, 60)}...
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
                          {metrics.readRate > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {metrics.readRate}% lidos
                            </span>
                          )}
                        </div>
                        {campaign.status === CampaignStatus.SENDING && (
                          <LinearProgress
                            variant="determinate"
                            value={metrics.progress}
                            color="success"
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
          <span className="font-semibold">Preview da Mensagem</span>
          <IconButton
            onClick={() => setPreviewOpen(false)}
            size="small"
          >
            <X className="w-4 h-4" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <div className="bg-[#e5ddd5] rounded-lg p-4">
            <div className="bg-[#dcf8c6] rounded-lg p-3 max-w-[80%] ml-auto shadow">
              <p className="text-sm text-slate-800 whitespace-pre-wrap">
                {getPreviewContent()}
              </p>
              <p className="text-xs text-slate-500 text-right mt-1">
                {format(new Date(), 'HH:mm')}
              </p>
            </div>
          </div>
          {mediaUrl && mediaType !== 'none' && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Midia anexada:</p>
              <div className="flex items-center gap-2">
                {mediaType === 'image' ? (
                  <Image className="w-4 h-4 text-blue-500" />
                ) : (
                  <FileIcon className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-sm text-slate-700 truncate">{mediaUrl}</span>
              </div>
            </div>
          )}
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
            Voce esta prestes a enviar mensagens WhatsApp para{' '}
            <strong>{selectedContacts.length}</strong> contato(s).
          </p>
          <Alert severity="info" sx={{ mt: 2 }}>
            As mensagens serao enviadas em lotes com intervalo de 3 segundos entre cada uma para evitar bloqueio.
            Voce pode acompanhar o progresso na aba "Campanhas".
          </Alert>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Certifique-se de que o WhatsApp esta conectado e ativo no sistema.
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
            color="success"
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
            Agende o envio para <strong>{selectedContacts.length}</strong> contato(s).
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
            color="success"
            onClick={() => handleCreateCampaign(false)}
            disabled={!scheduledDate || !scheduledTime}
            startIcon={<Calendar className="w-4 h-4" />}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Agendar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Campaign Details Dialog - Real-time updates */}
      <CampaignDetailsModal
        open={campaignDetailsOpen}
        campaign={selectedCampaign}
        onClose={() => setCampaignDetailsOpen(false)}
        onPause={handlePauseCampaign}
        onResume={handleResumeCampaign}
        onCancel={handleCancelCampaign}
        onStart={handleStartCampaign}
        renderStatusChip={renderStatusChip}
      />
    </div>
  );
}
