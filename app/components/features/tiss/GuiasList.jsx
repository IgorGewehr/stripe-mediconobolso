'use client';

/**
 * @fileoverview GuiasList Component
 * @description List of TISS guides with modern row design
 * @design Inspired by modern billing dashboard patterns
 */

import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Chip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    Paper,
    Divider,
    alpha,
} from '@mui/material';
import {
    MoreHoriz,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as ValidateIcon,
    Visibility as ViewIcon,
    Description as GuiaIcon,
    CalendarToday as CalendarIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { useTiss } from '../../hooks/useTiss';

// Theme colors matching the TISS dashboard design
const themeColors = {
    primary: '#1852FE',
    primaryLight: '#E9EFFF',
    success: '#0CAF60',
    successLight: '#E6F7EF',
    error: '#FF4B55',
    errorLight: '#FFEBEC',
    warning: '#FFAB2B',
    warningLight: '#FFF8E6',
    info: '#3B82F6',
    infoLight: '#EFF6FF',
    textPrimary: '#111E5A',
    textSecondary: '#4B5574',
    textTertiary: '#7E84A3',
    backgroundSecondary: '#F8FAFC',
    borderColor: 'rgba(17, 30, 90, 0.08)',
};

const STATUS_CONFIG = {
    pending: { label: 'Pendente', bg: '#F1F5F9', text: '#64748B' },
    rascunho: { label: 'Rascunho', bg: '#F1F5F9', text: '#64748B' },
    validado: { label: 'Validado', bg: themeColors.infoLight, text: themeColors.info },
    submitted: { label: 'Enviado', bg: themeColors.primaryLight, text: themeColors.primary },
    enviado: { label: 'Enviado', bg: themeColors.primaryLight, text: themeColors.primary },
    accepted: { label: 'Aceito', bg: themeColors.successLight, text: themeColors.success },
    aceito: { label: 'Aceito', bg: themeColors.successLight, text: themeColors.success },
    denied: { label: 'Negado', bg: themeColors.errorLight, text: themeColors.error },
    glosado: { label: 'Glosado', bg: themeColors.errorLight, text: themeColors.error },
    paid: { label: 'Pago', bg: '#DCFCE7', text: '#16A34A' },
    pago: { label: 'Pago', bg: '#DCFCE7', text: '#16A34A' },
};

const TIPO_GUIA_CONFIG = {
    PS: { label: 'PS', full: 'Profissional Saude' },
    SP: { label: 'SP', full: 'Servico Profissional' },
    UR: { label: 'UR', full: 'Urgencia' },
    PA: { label: 'PA', full: 'Acidentario' },
    consulta: { label: 'CS', full: 'Consulta' },
    sadt: { label: 'SP', full: 'SP/SADT' },
    internacao: { label: 'IN', full: 'Internacao' },
    honorarios: { label: 'HN', full: 'Honorarios' },
    anexo_clinico: { label: 'AC', full: 'Anexo Clinico' },
};

/**
 * GuiaRow - Modern guia row component
 */
function GuiaRow({ guia, onView, onEdit, onDelete, onValidate }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const statusConfig = STATUS_CONFIG[guia.status] || STATUS_CONFIG.pending;
    const tipoConfig = TIPO_GUIA_CONFIG[guia.tipo_guia] || { label: guia.tipo_guia, full: guia.tipo_guia };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    return (
        <Paper
            elevation={0}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                mb: 1.5,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: themeColors.borderColor,
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: alpha(themeColors.primary, 0.3),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: themeColors.primaryLight,
                    }}
                >
                    <GuiaIcon sx={{ color: themeColors.primary, fontSize: 22 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                            Guia #{guia.numero_guia_prestador || guia.numero || guia.id?.slice(-6)}
                        </Typography>
                        <Chip
                            size="small"
                            label={tipoConfig.label}
                            sx={{
                                height: 20,
                                fontSize: 11,
                                fontWeight: 600,
                                bgcolor: '#F1F5F9',
                                color: '#64748B',
                            }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color={themeColors.textSecondary}>
                            {guia.beneficiario_nome || guia.beneficiario || 'Beneficiario nao informado'}
                        </Typography>
                        <Typography variant="body2" color={themeColors.textTertiary}>•</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: 14, color: themeColors.textTertiary }} />
                            <Typography variant="body2" color={themeColors.textSecondary}>
                                {formatDate(guia.data_atendimento || guia.dataAtendimento)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                        {formatCurrency(guia.valor_total || guia.valor)}
                    </Typography>
                    <Chip
                        size="small"
                        label={statusConfig.label}
                        sx={{
                            mt: 0.5,
                            height: 22,
                            fontSize: 11,
                            fontWeight: 500,
                            border: 'none',
                            bgcolor: statusConfig.bg,
                            color: statusConfig.text,
                        }}
                    />
                </Box>

                <IconButton
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{
                        color: themeColors.textTertiary,
                        '&:hover': { color: themeColors.primary },
                    }}
                >
                    <MoreHoriz />
                </IconButton>

                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={() => setAnchorEl(null)}
                    PaperProps={{
                        sx: { borderRadius: '12px', minWidth: 180 },
                    }}
                >
                    <MenuItem onClick={() => {
                        setAnchorEl(null);
                        onView?.(guia);
                    }}>
                        <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Visualizar</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => {
                        setAnchorEl(null);
                        onEdit?.(guia);
                    }}>
                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Editar</ListItemText>
                    </MenuItem>
                    <MenuItem>
                        <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Baixar PDF</ListItemText>
                    </MenuItem>
                    {guia.status === 'rascunho' && (
                        <MenuItem onClick={() => {
                            setAnchorEl(null);
                            onValidate?.(guia);
                        }}>
                            <ListItemIcon><ValidateIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>Validar</ListItemText>
                        </MenuItem>
                    )}
                    <Divider />
                    <MenuItem
                        onClick={() => {
                            setAnchorEl(null);
                            onDelete?.(guia);
                        }}
                        sx={{ color: themeColors.error }}
                    >
                        <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: themeColors.error }} /></ListItemIcon>
                        <ListItemText>Excluir</ListItemText>
                    </MenuItem>
                </Menu>
            </Box>
        </Paper>
    );
}

/**
 * Empty State component
 */
function EmptyState({ searchQuery }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, textAlign: 'center' }}>
            <Box
                sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: themeColors.backgroundSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                }}
            >
                <GuiaIcon sx={{ fontSize: 32, color: themeColors.textTertiary }} />
            </Box>
            <Typography variant="h6" fontWeight={600} color={themeColors.textPrimary}>
                Nenhuma guia encontrada
            </Typography>
            <Typography variant="body2" color={themeColors.textSecondary} sx={{ maxWidth: 400, mt: 1 }}>
                {searchQuery
                    ? 'Nao encontramos guias com esse criterio. Tente ajustar os filtros.'
                    : 'Crie uma nova guia ou ajuste seus filtros para visualizar resultados.'}
            </Typography>
        </Box>
    );
}

/**
 * GuiasList - Main component
 */
export default function GuiasList({ searchQuery = '', onEdit, onView, onAdd }) {
    const { guias, loading, fetchGuias, deleteGuia, validarGuia } = useTiss();

    const [statusFilter, setStatusFilter] = useState('');
    const [tipoFilter, setTipoFilter] = useState('');

    // Debug: Log guias state changes
    useEffect(() => {
        console.log('[GuiasList] Estado atualizado:', {
            loading,
            guiasCount: guias?.length || 0,
            statusFilter,
            tipoFilter,
            guias: guias?.slice(0, 3) // Log first 3 guias
        });
    }, [guias, loading, statusFilter, tipoFilter]);

    useEffect(() => {
        console.log('[GuiasList] Buscando guias com filtros:', { statusFilter, tipoFilter });
        fetchGuias({
            status: statusFilter || undefined,
            tipo_guia: tipoFilter || undefined,
        });
    }, [fetchGuias, statusFilter, tipoFilter]);

    // Filter guias based on search query
    const filteredGuias = useMemo(() => {
        if (!guias) return [];
        let filtered = guias;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((g) =>
                g.numero_guia_prestador?.toLowerCase().includes(query) ||
                g.beneficiario_nome?.toLowerCase().includes(query) ||
                g.numero?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [guias, searchQuery]);

    const handleView = (guia) => {
        onView?.(guia);
    };

    const handleEdit = (guia) => {
        onEdit?.(guia);
    };

    const handleDelete = async (guia) => {
        try {
            await deleteGuia(guia.id);
        } catch (err) {
            console.error('Erro ao deletar guia:', err);
        }
    };

    const handleValidate = async (guia) => {
        try {
            await validarGuia(guia.id);
        } catch (err) {
            console.error('Erro ao validar guia:', err);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) => setStatusFilter(e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: '10px' }}
                    >
                        <MenuItem value="">Todos os Status</MenuItem>
                        <MenuItem value="pending">Pendente</MenuItem>
                        <MenuItem value="rascunho">Rascunho</MenuItem>
                        <MenuItem value="validado">Validado</MenuItem>
                        <MenuItem value="enviado">Enviado</MenuItem>
                        <MenuItem value="aceito">Aceito</MenuItem>
                        <MenuItem value="glosado">Glosado</MenuItem>
                        <MenuItem value="pago">Pago</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                        value={tipoFilter}
                        label="Tipo"
                        onChange={(e) => setTipoFilter(e.target.value)}
                        sx={{ bgcolor: 'white', borderRadius: '10px' }}
                    >
                        <MenuItem value="">Todos os Tipos</MenuItem>
                        <MenuItem value="consulta">Consulta</MenuItem>
                        <MenuItem value="sadt">SP/SADT</MenuItem>
                        <MenuItem value="internacao">Internacao</MenuItem>
                        <MenuItem value="honorarios">Honorarios</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Guias List */}
            {filteredGuias.length === 0 ? (
                <EmptyState searchQuery={searchQuery} />
            ) : (
                <Box>
                    {filteredGuias.map((guia) => (
                        <GuiaRow
                            key={guia.id}
                            guia={guia}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onValidate={handleValidate}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}
