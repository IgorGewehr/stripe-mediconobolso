'use client';

/**
 * DigitalPrescriptionForm - Formulario de Receita Digital com Assinatura ICP-Brasil
 *
 * Funcionalidades:
 * - Classificacao automatica de medicamentos controlados (Portaria 344)
 * - Validacao de tipo de receituario necessario
 * - Assinatura digital com certificado ICP-Brasil
 * - Geracao de QR Code para validacao em farmacias
 * - Envio para paciente (Email/WhatsApp)
 *
 * Conformidade:
 * - MP 2.200-2/2001 (ICP-Brasil)
 * - Resolucao CFM 2.314/2022 (Telemedicina)
 * - Portaria SVS/MS 344/1998 (Controlados)
 * - RDC ANVISA 471/2021 (Antimicrobianos)
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Autocomplete,
  Chip,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Grid,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Card,
  CardContent,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocalPharmacy as DrugIcon,
  Security as SignIcon,
  QrCode as QrIcon,
  Send as SendIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  ContentCopy as CopyIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos de receita
const PRESCRIPTION_TYPES = {
  simple: {
    label: 'Receita Simples',
    color: '#4CAF50',
    validity: 30,
    requiresSignature: false,
    description: 'Para medicamentos comuns sem controle especial',
  },
  controlled_white: {
    label: 'Receita de Controle Especial',
    color: '#2196F3',
    validity: 30,
    requiresSignature: true,
    description: 'Para medicamentos da lista C1 (2 vias)',
  },
  controlled_yellow: {
    label: 'Notificacao A (Amarela)',
    color: '#FFC107',
    validity: 30,
    requiresSignature: false,
    canBeDigital: false,
    description: 'Para entorpecentes (listas A1/A2) - Requer talonario fisico',
  },
  controlled_blue: {
    label: 'Notificacao B (Azul)',
    color: '#03A9F4',
    validity: 30,
    requiresSignature: false,
    canBeDigital: false,
    description: 'Para psicotropicos (listas B1/B2) - Requer talonario fisico',
  },
  antimicrobial: {
    label: 'Receita de Antimicrobiano',
    color: '#9C27B0',
    validity: 10,
    requiresSignature: true,
    description: 'Para antibioticos (RDC 471/2021) - Validade 10 dias',
  },
};

// Tipos de medicamento controlado
const CONTROLLED_TYPES = {
  none: { label: 'Nao controlado', color: 'default', recipe: 'simple' },
  a: { label: 'Lista A (Entorpecentes)', color: 'warning', recipe: 'controlled_yellow' },
  b1: { label: 'Lista B1 (Psicotropicos)', color: 'info', recipe: 'controlled_blue' },
  b2: { label: 'Lista B2 (Anorexigenos)', color: 'info', recipe: 'controlled_blue' },
  c1: { label: 'Lista C1 (Outras)', color: 'primary', recipe: 'controlled_white' },
  antimicrobial: { label: 'Antimicrobiano', color: 'secondary', recipe: 'antimicrobial' },
};

// Steps do formulario
const STEPS = [
  'Paciente e Tipo',
  'Medicamentos',
  'Revisao',
  'Assinatura',
  'Envio',
];

// Componente de item de medicamento
const MedicationItem = memo(({
  item,
  index,
  onUpdate,
  onRemove,
  onSearchDrug,
  drugOptions = [],
  loadingDrugs = false,
}) => {
  const theme = useTheme();
  const controlledConfig = CONTROLLED_TYPES[item.controlledType || 'none'];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        border: 1,
        borderColor: controlledConfig.color !== 'default'
          ? `${controlledConfig.color}.main`
          : 'divider',
        borderRadius: 2,
        bgcolor: controlledConfig.color !== 'default'
          ? alpha(theme.palette[controlledConfig.color]?.main || theme.palette.grey[500], 0.02)
          : 'background.paper',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="subtitle2" fontWeight={600}>
            Medicamento {index + 1}
          </Typography>
          {item.controlledType && item.controlledType !== 'none' && (
            <Chip
              size="small"
              icon={<WarningIcon sx={{ fontSize: 14 }} />}
              label={controlledConfig.label}
              color={controlledConfig.color}
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
          )}
        </Box>
        <IconButton size="small" color="error" onClick={() => onRemove(index)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      <Grid container spacing={2}>
        {/* Nome do medicamento com autocomplete */}
        <Grid item xs={12} md={6}>
          <Autocomplete
            freeSolo
            options={drugOptions}
            getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.name}
            loading={loadingDrugs}
            value={item.drugName || ''}
            onInputChange={(_, value) => {
              onUpdate(index, { ...item, drugName: value });
              if (value?.length > 2) onSearchDrug(value);
            }}
            onChange={(_, value) => {
              if (value && typeof value !== 'string') {
                onUpdate(index, {
                  ...item,
                  drugId: value.id,
                  drugName: value.name,
                  activeIngredient: value.activeIngredient,
                  concentration: value.concentration,
                  pharmaceuticalForm: value.pharmaceuticalForm,
                  controlledType: value.controlledType || 'none',
                });
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Medicamento"
                placeholder="Digite para buscar..."
                size="small"
                required
              />
            )}
          />
        </Grid>

        {/* Concentracao */}
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Concentracao"
            value={item.concentration || ''}
            onChange={(e) => onUpdate(index, { ...item, concentration: e.target.value })}
            placeholder="ex: 500mg"
          />
        </Grid>

        {/* Forma farmaceutica */}
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Forma"
            value={item.pharmaceuticalForm || ''}
            onChange={(e) => onUpdate(index, { ...item, pharmaceuticalForm: e.target.value })}
            placeholder="ex: Comprimido"
          />
        </Grid>

        {/* Quantidade */}
        <Grid item xs={4} md={2}>
          <TextField
            fullWidth
            size="small"
            label="Quantidade"
            type="number"
            value={item.quantity || ''}
            onChange={(e) => onUpdate(index, { ...item, quantity: parseInt(e.target.value) || 0 })}
            required
          />
        </Grid>

        {/* Unidade */}
        <Grid item xs={4} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Unidade</InputLabel>
            <Select
              value={item.unit || 'comprimidos'}
              label="Unidade"
              onChange={(e) => onUpdate(index, { ...item, unit: e.target.value })}
            >
              <MenuItem value="comprimidos">Comprimidos</MenuItem>
              <MenuItem value="capsulas">Capsulas</MenuItem>
              <MenuItem value="ml">mL</MenuItem>
              <MenuItem value="ampolas">Ampolas</MenuItem>
              <MenuItem value="frascos">Frascos</MenuItem>
              <MenuItem value="bisnagas">Bisnagas</MenuItem>
              <MenuItem value="caixas">Caixas</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Uso continuo */}
        <Grid item xs={4} md={2}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={item.continuousUse || false}
                onChange={(e) => onUpdate(index, { ...item, continuousUse: e.target.checked })}
              />
            }
            label="Uso continuo"
          />
        </Grid>

        {/* Posologia */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            size="small"
            label="Posologia"
            value={item.dosage || ''}
            onChange={(e) => onUpdate(index, { ...item, dosage: e.target.value })}
            placeholder="ex: Tomar 1 comprimido de 8 em 8 horas"
            required
          />
        </Grid>

        {/* Frequencia */}
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Frequencia"
            value={item.frequency || ''}
            onChange={(e) => onUpdate(index, { ...item, frequency: e.target.value })}
            placeholder="ex: 3x ao dia"
          />
        </Grid>

        {/* Duracao */}
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Duracao"
            value={item.duration || ''}
            onChange={(e) => onUpdate(index, { ...item, duration: e.target.value })}
            placeholder="ex: 7 dias"
          />
        </Grid>

        {/* Instrucoes adicionais */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Instrucoes adicionais"
            value={item.instructions || ''}
            onChange={(e) => onUpdate(index, { ...item, instructions: e.target.value })}
            placeholder="ex: Tomar apos as refeicoes"
            multiline
            rows={2}
          />
        </Grid>
      </Grid>
    </Paper>
  );
});
MedicationItem.displayName = 'MedicationItem';

// Dialog de confirmacao de assinatura
const SignatureDialog = memo(({ open, onClose, onConfirm, certificate, loading }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SignIcon color="primary" />
          Assinar Receita Digitalmente
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Assinatura Digital ICP-Brasil</AlertTitle>
          Esta receita sera assinada com seu certificado digital, garantindo validade juridica
          conforme MP 2.200-2/2001.
        </Alert>

        {certificate ? (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <VerifiedIcon color="success" />
                <Typography variant="subtitle2">Certificado Ativo</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Titular: {certificate.holderName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CRM: {certificate.professionalRegistration}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Valido ate: {format(new Date(certificate.expiresAt), 'dd/MM/yyyy')}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Nenhum certificado digital configurado. Configure seu certificado A1 para assinar receitas.
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary">
          Ao confirmar, voce declara que:
        </Typography>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>
            <Typography variant="body2" color="text.secondary">
              Os dados da receita estao corretos
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              A prescricao segue as normas do CFM e ANVISA
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Esta ciente da responsabilidade legal
            </Typography>
          </li>
        </ul>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={!certificate || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <SignIcon />}
        >
          Assinar Receita
        </Button>
      </DialogActions>
    </Dialog>
  );
});
SignatureDialog.displayName = 'SignatureDialog';

// Dialog de envio
const SendDialog = memo(({ open, onClose, prescription, onSend, loading }) => {
  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [email, setEmail] = useState(prescription?.patient?.email || '');
  const [phone, setPhone] = useState(prescription?.patient?.phone || '');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SendIcon color="primary" />
          Enviar Receita para Paciente
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* QR Code */}
          {prescription?.qrCode && (
            <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={2}>
              <Box
                dangerouslySetInnerHTML={{ __html: prescription.qrCode.qrSvg }}
                sx={{ maxWidth: 200, mx: 'auto' }}
              />
              <Typography variant="body2" color="text.secondary" mt={1}>
                Codigo: <strong>{prescription.qrCode.validationCode}</strong>
              </Typography>
              <Tooltip title="Copiar codigo">
                <IconButton size="small">
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          <Divider />

          {/* Email */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon fontSize="small" />
                  Enviar por Email
                </Box>
              }
            />
            {sendEmail && (
              <TextField
                fullWidth
                size="small"
                label="Email do paciente"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          {/* WhatsApp */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={sendWhatsApp}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} />
                  Enviar por WhatsApp
                </Box>
              }
            />
            {sendWhatsApp && (
              <TextField
                fullWidth
                size="small"
                label="WhatsApp do paciente"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => {/* Download PDF */}}
        >
          Baixar PDF
        </Button>
        <Button
          variant="contained"
          onClick={() => onSend({ email: sendEmail ? email : null, phone: sendWhatsApp ? phone : null })}
          disabled={loading || (!sendEmail && !sendWhatsApp)}
          startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
        >
          Enviar
        </Button>
      </DialogActions>
    </Dialog>
  );
});
SendDialog.displayName = 'SendDialog';

// Componente Principal
export default function DigitalPrescriptionForm({
  patient,
  onSave,
  onCancel,
  certificate,
  searchDrugs,
}) {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [prescriptionType, setPrescriptionType] = useState('simple');
  const [items, setItems] = useState([]);
  const [observations, setObservations] = useState('');
  const [drugOptions, setDrugOptions] = useState([]);
  const [loadingDrugs, setLoadingDrugs] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signedPrescription, setSignedPrescription] = useState(null);

  // Determinar tipo de receita baseado nos medicamentos
  const requiredRecipeType = useMemo(() => {
    let maxRestriction = 'simple';
    const order = ['simple', 'antimicrobial', 'controlled_white', 'controlled_blue', 'controlled_yellow'];

    for (const item of items) {
      const controlledType = item.controlledType || 'none';
      const requiredType = CONTROLLED_TYPES[controlledType]?.recipe || 'simple';
      if (order.indexOf(requiredType) > order.indexOf(maxRestriction)) {
        maxRestriction = requiredType;
      }
    }

    return maxRestriction;
  }, [items]);

  // Verificar se pode ser assinada digitalmente
  const canBeDigital = useMemo(() => {
    return PRESCRIPTION_TYPES[requiredRecipeType]?.canBeDigital !== false;
  }, [requiredRecipeType]);

  // Validade
  const validityDate = useMemo(() => {
    const days = PRESCRIPTION_TYPES[requiredRecipeType]?.validity || 30;
    return addDays(new Date(), days);
  }, [requiredRecipeType]);

  // Handlers
  const handleSearchDrug = useCallback(async (term) => {
    if (!searchDrugs) return;
    setLoadingDrugs(true);
    try {
      const results = await searchDrugs(term);
      setDrugOptions(results || []);
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error);
    } finally {
      setLoadingDrugs(false);
    }
  }, [searchDrugs]);

  const handleAddItem = useCallback(() => {
    setItems([...items, {
      drugName: '',
      quantity: 1,
      unit: 'comprimidos',
      dosage: '',
    }]);
  }, [items]);

  const handleUpdateItem = useCallback((index, updatedItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
  }, [items]);

  const handleRemoveItem = useCallback((index) => {
    setItems(items.filter((_, i) => i !== index));
  }, [items]);

  const handleSign = useCallback(async () => {
    setLoading(true);
    try {
      // Aqui chamaria a API de assinatura
      const result = await onSave?.({
        patientId: patient?.id,
        prescriptionType: requiredRecipeType,
        items,
        observations,
        sign: true,
      });
      setSignedPrescription(result);
      setSignatureDialogOpen(false);
      setActiveStep(4); // Ir para envio
    } catch (error) {
      console.error('Erro ao assinar:', error);
    } finally {
      setLoading(false);
    }
  }, [patient, requiredRecipeType, items, observations, onSave]);

  const handleSend = useCallback(async (sendOptions) => {
    setLoading(true);
    try {
      // Aqui chamaria a API de envio
      await onSave?.({
        ...signedPrescription,
        send: sendOptions,
      });
      setSendDialogOpen(false);
    } catch (error) {
      console.error('Erro ao enviar:', error);
    } finally {
      setLoading(false);
    }
  }, [signedPrescription, onSave]);

  const canProceed = useMemo(() => {
    switch (activeStep) {
      case 0: // Paciente e tipo
        return !!patient;
      case 1: // Medicamentos
        return items.length > 0 && items.every(i => i.drugName && i.quantity && i.dosage);
      case 2: // Revisao
        return true;
      case 3: // Assinatura
        return signedPrescription?.signed;
      default:
        return true;
    }
  }, [activeStep, patient, items, signedPrescription]);

  return (
    <Box>
      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Alerta se receita nao pode ser digital */}
      {!canBeDigital && items.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Receita Requer Talonario Fisico</AlertTitle>
          Um ou mais medicamentos requerem Notificacao de Receita A ou B, que nao pode ser emitida digitalmente.
          Use seu talonario de notificacoes fornecido pela vigilancia sanitaria.
        </Alert>
      )}

      {/* Step 0: Paciente e Tipo */}
      {activeStep === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Dados do Paciente
          </Typography>
          {patient ? (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>
                  {patient.name}
                </Typography>
                {patient.cpf && (
                  <Typography variant="body2" color="text.secondary">
                    CPF: {patient.cpf}
                  </Typography>
                )}
                {patient.birthDate && (
                  <Typography variant="body2" color="text.secondary">
                    Nascimento: {format(new Date(patient.birthDate), 'dd/MM/yyyy')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              Selecione um paciente antes de criar a receita.
            </Alert>
          )}

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Tipo de Receita
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            O tipo sera ajustado automaticamente conforme os medicamentos adicionados.
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(PRESCRIPTION_TYPES).map(([key, config]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    cursor: config.canBeDigital !== false ? 'pointer' : 'default',
                    opacity: config.canBeDigital === false ? 0.5 : 1,
                    borderColor: requiredRecipeType === key ? config.color : 'divider',
                    borderWidth: requiredRecipeType === key ? 2 : 1,
                    bgcolor: requiredRecipeType === key ? alpha(config.color, 0.05) : 'transparent',
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: config.color,
                      }}
                    />
                    <Typography variant="subtitle2" fontWeight={600}>
                      {config.label}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {config.description}
                  </Typography>
                  {config.canBeDigital === false && (
                    <Chip
                      size="small"
                      icon={<WarningIcon sx={{ fontSize: 12 }} />}
                      label="Requer talonario"
                      color="warning"
                      sx={{ mt: 1, height: 20, fontSize: '0.65rem' }}
                    />
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Step 1: Medicamentos */}
      {activeStep === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Medicamentos
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
            >
              Adicionar Medicamento
            </Button>
          </Box>

          {items.length === 0 ? (
            <Alert severity="info">
              Clique em "Adicionar Medicamento" para comecar a prescrever.
            </Alert>
          ) : (
            items.map((item, index) => (
              <MedicationItem
                key={index}
                item={item}
                index={index}
                onUpdate={handleUpdateItem}
                onRemove={handleRemoveItem}
                onSearchDrug={handleSearchDrug}
                drugOptions={drugOptions}
                loadingDrugs={loadingDrugs}
              />
            ))
          )}

          <TextField
            fullWidth
            label="Observacoes gerais"
            multiline
            rows={3}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Instrucoes adicionais, alergias, etc."
            sx={{ mt: 2 }}
          />
        </Box>
      )}

      {/* Step 2: Revisao */}
      {activeStep === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Revisao da Receita
          </Typography>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Paciente
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {patient?.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Tipo de Receita
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: PRESCRIPTION_TYPES[requiredRecipeType]?.color,
                      }}
                    />
                    <Typography variant="body1" fontWeight={500}>
                      {PRESCRIPTION_TYPES[requiredRecipeType]?.label}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Data de Emissao
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(), 'dd/MM/yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Validade
                  </Typography>
                  <Typography variant="body1">
                    {format(validityDate, 'dd/MM/yyyy')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Medicamentos ({items.length})
          </Typography>
          {items.map((item, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2, mb: 1 }}>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    {index + 1}. {item.drugName}
                    {item.concentration && ` - ${item.concentration}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.quantity} {item.unit} - {item.dosage}
                  </Typography>
                  {item.instructions && (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      {item.instructions}
                    </Typography>
                  )}
                </Box>
                {item.controlledType && item.controlledType !== 'none' && (
                  <Chip
                    size="small"
                    label={CONTROLLED_TYPES[item.controlledType]?.label}
                    color={CONTROLLED_TYPES[item.controlledType]?.color}
                  />
                )}
              </Box>
            </Paper>
          ))}

          {observations && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Observacoes:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {observations}
              </Typography>
            </Box>
          )}

          {!canBeDigital && (
            <Alert severity="error" sx={{ mt: 3 }}>
              <AlertTitle>Atencao</AlertTitle>
              Esta receita contem medicamentos que requerem notificacao de receita fisica.
              Utilize seu talonario oficial.
            </Alert>
          )}
        </Box>
      )}

      {/* Step 3: Assinatura */}
      {activeStep === 3 && (
        <Box textAlign="center" py={4}>
          {signedPrescription?.signed ? (
            <Box>
              <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Receita Assinada com Sucesso!
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                A receita foi assinada digitalmente e esta pronta para envio.
              </Typography>
              {signedPrescription.qrCode && (
                <Box
                  dangerouslySetInnerHTML={{ __html: signedPrescription.qrCode.qrSvg }}
                  sx={{ maxWidth: 200, mx: 'auto', mb: 2 }}
                />
              )}
            </Box>
          ) : (
            <Box>
              <SignIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Assinatura Digital
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                Clique no botao abaixo para assinar a receita com seu certificado digital ICP-Brasil.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<SignIcon />}
                onClick={() => setSignatureDialogOpen(true)}
                disabled={!canBeDigital || !certificate}
              >
                Assinar Receita
              </Button>
              {!certificate && (
                <Alert severity="warning" sx={{ mt: 2, maxWidth: 400, mx: 'auto' }}>
                  Configure seu certificado digital para assinar receitas.
                </Alert>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Step 4: Envio */}
      {activeStep === 4 && (
        <Box textAlign="center" py={4}>
          <SendIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Enviar para Paciente
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Escolha como deseja enviar a receita para {patient?.name}.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Baixar PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
            >
              Imprimir
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => setSendDialogOpen(true)}
            >
              Enviar
            </Button>
          </Stack>
        </Box>
      )}

      {/* Navegacao */}
      <Box display="flex" justifyContent="space-between" mt={4} pt={3} borderTop={1} borderColor="divider">
        <Button onClick={activeStep === 0 ? onCancel : () => setActiveStep(activeStep - 1)}>
          {activeStep === 0 ? 'Cancelar' : 'Voltar'}
        </Button>
        <Button
          variant="contained"
          onClick={() => setActiveStep(activeStep + 1)}
          disabled={!canProceed || activeStep === STEPS.length - 1}
        >
          {activeStep === STEPS.length - 2 ? 'Concluir' : 'Proximo'}
        </Button>
      </Box>

      {/* Dialogs */}
      <SignatureDialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        onConfirm={handleSign}
        certificate={certificate}
        loading={loading}
      />

      <SendDialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        prescription={signedPrescription}
        onSend={handleSend}
        loading={loading}
      />
    </Box>
  );
}
