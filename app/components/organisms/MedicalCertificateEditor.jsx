"use client";

/**
 * MedicalCertificateEditor - Editor de Atestados Médicos
 *
 * Componente para criar e editar atestados médicos com
 * suporte a assinatura digital.
 */

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    Divider,
    Chip,
    Alert,
    CircularProgress,
    IconButton,
    useTheme,
    alpha,
    Autocomplete,
    Paper,
} from '@mui/material';
import {
    Save as SaveIcon,
    Edit as EditIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    Close as CloseIcon,
    Person as PersonIcon,
    CalendarToday as CalendarTodayIcon,
    Description as DescriptionIcon,
    LocalHospital as LocalHospitalIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { prescriptionsService, patientsService } from '@/lib/services/api';
import DigitalSignatureDialog from './DigitalSignatureDialog';

// Tipos de atestado
const CERTIFICATE_TYPES = [
    { value: 'medical_leave', label: 'Atestado de Afastamento', description: 'Para afastamento do trabalho' },
    { value: 'fitness', label: 'Atestado de Aptidão', description: 'Aptidão para atividades físicas/trabalho' },
    { value: 'companion', label: 'Declaração de Acompanhante', description: 'Para acompanhante de paciente' },
    { value: 'presence', label: 'Atestado de Comparecimento', description: 'Confirmação de consulta' },
    { value: 'other', label: 'Outro', description: 'Outros tipos de atestado' },
];

// CID-10 comuns (simplificado)
const COMMON_ICD10 = [
    { code: 'J00', description: 'Nasofaringite aguda (resfriado comum)' },
    { code: 'J06', description: 'Infecções agudas das vias aéreas superiores' },
    { code: 'J11', description: 'Influenza (gripe)' },
    { code: 'R50', description: 'Febre de origem desconhecida' },
    { code: 'R51', description: 'Cefaleia' },
    { code: 'K52', description: 'Gastroenterite não infecciosa' },
    { code: 'M54', description: 'Dorsalgia (dor nas costas)' },
    { code: 'N39', description: 'Outros transtornos do aparelho urinário' },
    { code: 'Z00', description: 'Exame geral e investigação' },
];

export default function MedicalCertificateEditor({
    patientId,
    certificateId,
    onSave,
    onCancel,
    readOnly = false,
}) {
    const theme = useTheme();

    // Estados
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Dados do atestado
    const [certificateType, setCertificateType] = useState('medical_leave');
    const [content, setContent] = useState('');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    const [daysOff, setDaysOff] = useState(1);
    const [icd10Code, setIcd10Code] = useState('');
    const [purpose, setPurpose] = useState('');
    const [companionName, setCompanionName] = useState('');
    const [companionCpf, setCompanionCpf] = useState('');

    // Dados do paciente
    const [patient, setPatient] = useState(null);

    // Estado do atestado (se editando)
    const [certificate, setCertificate] = useState(null);

    // Diálogo de assinatura
    const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);

    // Carregar dados
    useEffect(() => {
        if (patientId) {
            loadPatient(patientId);
        }
        if (certificateId) {
            loadCertificate(certificateId);
        }
    }, [patientId, certificateId]);

    // Calcular dias quando datas mudam
    useEffect(() => {
        if (startDate && endDate) {
            const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
            setDaysOff(Math.max(1, days));
        }
    }, [startDate, endDate]);

    // Atualizar data final quando dias mudam
    const handleDaysChange = (days) => {
        setDaysOff(days);
        if (startDate) {
            setEndDate(format(addDays(new Date(startDate), days - 1), 'yyyy-MM-dd'));
        }
    };

    // Gerar conteúdo padrão baseado no tipo
    useEffect(() => {
        if (!content || content === generateDefaultContent(certificateType)) {
            setContent(generateDefaultContent(certificateType));
        }
    }, [certificateType, patient, daysOff, startDate, endDate]);

    const generateDefaultContent = (type) => {
        const patientName = patient?.patientName || '[Nome do Paciente]';
        const formattedStartDate = startDate ? format(new Date(startDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '[Data Início]';
        const formattedEndDate = endDate ? format(new Date(endDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '[Data Fim]';

        switch (type) {
            case 'medical_leave':
                return `Atesto para os devidos fins que o(a) paciente ${patientName} esteve sob meus cuidados profissionais, necessitando de afastamento de suas atividades por ${daysOff} dia(s), a partir de ${formattedStartDate} até ${formattedEndDate}.`;

            case 'fitness':
                return `Atesto para os devidos fins que o(a) paciente ${patientName} encontra-se em boas condições de saúde, estando apto(a) para a prática de atividades físicas/laborais.`;

            case 'companion':
                return `Declaro para os devidos fins que ${companionName || '[Nome do Acompanhante]'} acompanhou o(a) paciente ${patientName} durante atendimento médico realizado nesta data, permanecendo nas dependências da clínica/consultório durante todo o período da consulta.`;

            case 'presence':
                return `Atesto para os devidos fins que o(a) paciente ${patientName} compareceu a esta clínica/consultório nesta data para atendimento médico, permanecendo nas dependências durante o período de consulta.`;

            default:
                return '';
        }
    };

    const loadPatient = async (id) => {
        try {
            const patientData = await patientsService.getById(id);
            setPatient(patientData);
        } catch (err) {
            console.error('Erro ao carregar paciente:', err);
        }
    };

    const loadCertificate = async (id) => {
        setLoading(true);
        try {
            // Aqui seria a chamada para buscar o atestado existente
            // Por enquanto, simularemos
            // const certData = await prescriptionsService.getCertificateById(id);
            // setCertificate(certData);
            // Preencher campos com dados do atestado
        } catch (err) {
            console.error('Erro ao carregar atestado:', err);
            setError('Erro ao carregar atestado.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!patientId) {
            setError('Selecione um paciente.');
            return;
        }

        if (!content) {
            setError('O conteúdo do atestado é obrigatório.');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const certificateData = {
                type: certificateType,
                content,
                startDate: certificateType === 'medical_leave' ? startDate : null,
                endDate: certificateType === 'medical_leave' ? endDate : null,
                daysOff: certificateType === 'medical_leave' ? daysOff : null,
                icd10Code: icd10Code || null,
                purpose: purpose || null,
                companionName: certificateType === 'companion' ? companionName : null,
                companionCpf: certificateType === 'companion' ? companionCpf : null,
            };

            const result = await prescriptionsService.createCertificate(patientId, certificateData);

            setSuccess(true);
            setCertificate(result);

            if (onSave) {
                onSave(result);
            }
        } catch (err) {
            console.error('Erro ao salvar atestado:', err);
            setError(err.userMessage || 'Erro ao salvar atestado.');
        } finally {
            setSaving(false);
        }
    };

    const handleSign = () => {
        if (certificate) {
            setSignatureDialogOpen(true);
        }
    };

    const handleSignatureSuccess = (signedCert) => {
        setCertificate(signedCert);
        setSuccess(true);
    };

    const handleDownloadPdf = async () => {
        if (certificate) {
            try {
                await prescriptionsService.downloadCertificatePdf(certificate.id);
            } catch (err) {
                console.error('Erro ao baixar PDF:', err);
            }
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                    {error}
                </Alert>
            )}

            {success && certificate?.isSigned && (
                <Alert
                    severity="success"
                    sx={{ mb: 3, borderRadius: '12px' }}
                    icon={<CheckCircleIcon />}
                >
                    Atestado assinado digitalmente com sucesso!
                    <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadPdf}
                        sx={{ ml: 2 }}
                    >
                        Baixar PDF
                    </Button>
                </Alert>
            )}

            <Card sx={{ borderRadius: '24px', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)' }}>
                <CardContent sx={{ p: 4 }}>
                    {/* Cabeçalho */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <LocalHospitalIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                            <Box>
                                <Typography variant="h5" fontWeight={600}>
                                    {certificateId ? 'Editar Atestado' : 'Novo Atestado Médico'}
                                </Typography>
                                {patient && (
                                    <Typography variant="body2" color="text.secondary">
                                        Paciente: {patient.patientName}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {onCancel && (
                            <IconButton onClick={onCancel}>
                                <CloseIcon />
                            </IconButton>
                        )}
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {/* Formulário */}
                    <Grid container spacing={3}>
                        {/* Tipo de Atestado */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo de Atestado</InputLabel>
                                <Select
                                    value={certificateType}
                                    onChange={(e) => setCertificateType(e.target.value)}
                                    label="Tipo de Atestado"
                                    disabled={readOnly}
                                    sx={{ borderRadius: '12px' }}
                                >
                                    {CERTIFICATE_TYPES.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            <Box>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {type.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {type.description}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* CID-10 */}
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                freeSolo
                                options={COMMON_ICD10}
                                getOptionLabel={(option) =>
                                    typeof option === 'string' ? option : `${option.code} - ${option.description}`
                                }
                                value={icd10Code}
                                onChange={(e, newValue) => {
                                    setIcd10Code(typeof newValue === 'string' ? newValue : newValue?.code || '');
                                }}
                                onInputChange={(e, newInputValue) => {
                                    setIcd10Code(newInputValue);
                                }}
                                disabled={readOnly}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="CID-10 (opcional)"
                                        placeholder="Ex: J11"
                                        InputProps={{
                                            ...params.InputProps,
                                            sx: { borderRadius: '12px' },
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Campos específicos para afastamento */}
                        {certificateType === 'medical_leave' && (
                            <>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Data Início"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        disabled={readOnly}
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{ sx: { borderRadius: '12px' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Data Fim"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        disabled={readOnly}
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{ sx: { borderRadius: '12px' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Dias de Afastamento"
                                        value={daysOff}
                                        onChange={(e) => handleDaysChange(parseInt(e.target.value) || 1)}
                                        disabled={readOnly}
                                        InputProps={{
                                            sx: { borderRadius: '12px' },
                                            inputProps: { min: 1 },
                                        }}
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Campos específicos para acompanhante */}
                        {certificateType === 'companion' && (
                            <>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Nome do Acompanhante"
                                        value={companionName}
                                        onChange={(e) => setCompanionName(e.target.value)}
                                        disabled={readOnly}
                                        InputProps={{ sx: { borderRadius: '12px' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="CPF do Acompanhante"
                                        value={companionCpf}
                                        onChange={(e) => setCompanionCpf(e.target.value)}
                                        disabled={readOnly}
                                        placeholder="000.000.000-00"
                                        InputProps={{ sx: { borderRadius: '12px' } }}
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Finalidade */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Finalidade (opcional)"
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                disabled={readOnly}
                                placeholder="Ex: Apresentar ao empregador"
                                InputProps={{ sx: { borderRadius: '12px' } }}
                            />
                        </Grid>

                        {/* Conteúdo do Atestado */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                label="Conteúdo do Atestado"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={readOnly}
                                InputProps={{ sx: { borderRadius: '12px' } }}
                                helperText="Personalize o texto do atestado conforme necessário"
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    {/* Ações */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        {onCancel && (
                            <Button
                                variant="outlined"
                                onClick={onCancel}
                                sx={{ borderRadius: '20px' }}
                            >
                                Cancelar
                            </Button>
                        )}

                        {certificate && !certificate.isSigned && (
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<EditIcon />}
                                onClick={handleSign}
                                sx={{ borderRadius: '20px' }}
                            >
                                Assinar Digitalmente
                            </Button>
                        )}

                        {certificate && certificate.isSigned && (
                            <>
                                <Button
                                    variant="outlined"
                                    startIcon={<PrintIcon />}
                                    sx={{ borderRadius: '20px' }}
                                >
                                    Imprimir
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={handleDownloadPdf}
                                    sx={{ borderRadius: '20px' }}
                                >
                                    Baixar PDF
                                </Button>
                            </>
                        )}

                        {!certificate && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                onClick={handleSave}
                                disabled={saving || readOnly}
                                sx={{ borderRadius: '20px' }}
                            >
                                {saving ? 'Salvando...' : 'Salvar Atestado'}
                            </Button>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Diálogo de Assinatura */}
            <DigitalSignatureDialog
                open={signatureDialogOpen}
                onClose={() => setSignatureDialogOpen(false)}
                documentType="certificate"
                documentId={certificate?.id}
                onSuccess={handleSignatureSuccess}
            />
        </Box>
    );
}
