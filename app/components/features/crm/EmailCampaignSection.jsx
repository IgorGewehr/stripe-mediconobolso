'use client';

/**
 * @fileoverview Email Campaign Section - Mass Email Sending
 * @description Elegant component for configuring and sending mass emails to patients
 */

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePatients } from '../../hooks';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  { id: 'all', label: 'Todos os Pacientes', icon: Users },
  { id: 'inactive_30', label: 'Inativos 30+ dias', icon: Clock },
  { id: 'inactive_90', label: 'Inativos 90+ dias', icon: AlertCircle },
  { id: 'recent', label: 'Ultimas consultas (7 dias)', icon: CheckCircle2 },
];

// ============================================================================
// Main Component
// ============================================================================

export default function EmailCampaignSection({ onSuccess, onError }) {
  // State
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState('all');
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Hooks
  const { patients, loading: loadingPatients } = usePatients({ autoLoad: true });

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

  // Handle send emails
  const handleSendEmails = async () => {
    if (selectedPatients.length === 0) {
      onError?.('Selecione pelo menos um paciente');
      return;
    }

    if (!subject.trim() || !body.trim()) {
      onError?.('Preencha o assunto e o corpo do email');
      return;
    }

    setConfirmOpen(false);
    setSending(true);
    setSendProgress(0);

    try {
      const selectedPatientsData = patientsWithEmail.filter((p) =>
        selectedPatients.includes(p.id)
      );

      let sent = 0;
      const total = selectedPatientsData.length;

      for (const patient of selectedPatientsData) {
        const email = patient.patientEmail || patient.email;
        const name = patient.patientName || patient.name || 'Paciente';

        // Replace placeholders
        const personalizedSubject = subject.replace(/\{\{nome\}\}/gi, name);
        const personalizedBody = body
          .replace(/\{\{nome\}\}/gi, name)
          .replace(/\{\{medico\}\}/gi, 'Dr(a). Equipe Medica');

        try {
          await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              name,
              type: 'custom',
              subject: personalizedSubject,
              body: personalizedBody,
            }),
          });
        } catch (err) {
          console.error(`Erro ao enviar para ${email}:`, err);
        }

        sent++;
        setSendProgress(Math.round((sent / total) * 100));

        // Small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      onSuccess?.(`${sent} email(s) enviado(s) com sucesso!`);
      setSelectedPatients([]);
    } catch (err) {
      onError?.('Erro ao enviar emails');
    } finally {
      setSending(false);
      setSendProgress(0);
    }
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
          {selectedPatients.length > 0 && (
            <Chip
              icon={<UserCheck className="w-4 h-4" />}
              label={`${selectedPatients.length} selecionados`}
              size="small"
              color="primary"
            />
          )}
        </div>
      </div>

      {/* Two Column Layout */}
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

          {/* Send Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={
              sending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Send className="w-5 h-5" />
              )
            }
            onClick={() => setConfirmOpen(true)}
            disabled={
              sending ||
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
            }}
          >
            {sending
              ? `Enviando... ${sendProgress}%`
              : `Enviar para ${selectedPatients.length} paciente(s)`}
          </Button>

          {sending && (
            <LinearProgress
              variant="determinate"
              value={sendProgress}
              sx={{ borderRadius: '4px', height: 6 }}
            />
          )}
        </div>
      </div>

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
          <p className="text-sm text-slate-500 mt-2">
            Esta acao nao pode ser desfeita.
          </p>
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
            onClick={handleSendEmails}
            startIcon={<Send className="w-4 h-4" />}
            sx={{ borderRadius: '10px', textTransform: 'none' }}
          >
            Confirmar Envio
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
