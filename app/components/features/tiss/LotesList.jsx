'use client';

/**
 * @fileoverview LotesList Component
 * @description List of TISS lotes with modern row design
 * @design Inspired by modern billing dashboard patterns
 */

import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Chip,
    Button,
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
    Visibility as ViewIcon,
    Lock as LockIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon,
    Send as SendIcon,
    Inventory2 as PackageIcon,
    CalendarToday as CalendarIcon,
    Tag as TagIcon,
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
    purple: '#8B5CF6',
    purpleLight: '#F3E8FF',
    textPrimary: '#111E5A',
    textSecondary: '#4B5574',
    textTertiary: '#7E84A3',
    backgroundSecondary: '#F8FAFC',
    borderColor: 'rgba(17, 30, 90, 0.08)',
};

const STATUS_CONFIG = {
    draft: { label: 'Rascunho', bg: '#F1F5F9', text: '#64748B' },
    aberto: { label: 'Aberto', bg: themeColors.warningLight, text: themeColors.warning },
    open: { label: 'Aberto', bg: themeColors.warningLight, text: themeColors.warning },
    fechado: { label: 'Fechado', bg: '#E2E8F0', text: '#475569' },
    closed: { label: 'Fechado', bg: '#E2E8F0', text: '#475569' },
    processing: { label: 'Processando', bg: themeColors.infoLight, text: themeColors.info },
    processando: { label: 'Processando', bg: themeColors.infoLight, text: themeColors.info },
    sent: { label: 'Enviado', bg: themeColors.successLight, text: themeColors.success },
    enviado: { label: 'Enviado', bg: themeColors.successLight, text: themeColors.success },
    aceito: { label: 'Aceito', bg: themeColors.successLight, text: themeColors.success },
    rejeitado: { label: 'Rejeitado', bg: themeColors.errorLight, text: themeColors.error },
    pago: { label: 'Pago', bg: '#DCFCE7', text: '#16A34A' },
};

/**
 * LoteRow - Modern lote row component
 */
function LoteRow({ lote, onView, onClose, onDownloadXml, onDelete }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const statusConfig = STATUS_CONFIG[lote.status] || STATUS_CONFIG.draft;

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

    const isOpen = lote.status === 'aberto' || lote.status === 'open';
    const hasXml = lote.xml_conteudo || lote.status === 'fechado' || lote.status === 'enviado';

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
                    borderColor: alpha(themeColors.purple, 0.3),
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
                        bgcolor: themeColors.purpleLight,
                    }}
                >
                    <PackageIcon sx={{ color: themeColors.purple, fontSize: 22 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                        Lote #{lote.numero_lote || lote.numero || lote.id?.slice(-6)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TagIcon sx={{ fontSize: 14, color: themeColors.textTertiary }} />
                            <Typography variant="body2" color={themeColors.textSecondary}>
                                {lote.quantidade_guias || lote.guias || 0} guias
                            </Typography>
                        </Box>
                        <Typography variant="body2" color={themeColors.textTertiary}>•</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: 14, color: themeColors.textTertiary }} />
                            <Typography variant="body2" color={themeColors.textSecondary}>
                                Criado em {formatDate(lote.data_criacao || lote.dataCriacao || lote.created_at)}
                            </Typography>
                        </Box>
                        {lote.operadora_nome && (
                            <>
                                <Typography variant="body2" color={themeColors.textTertiary}>•</Typography>
                                <Typography variant="body2" color={themeColors.textSecondary}>
                                    {lote.operadora_nome}
                                </Typography>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                        {formatCurrency(lote.valor_total || lote.valor)}
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

                {isOpen ? (
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onView?.(lote)}
                        sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 500,
                        }}
                    >
                        Ver Detalhes
                    </Button>
                ) : (
                    <IconButton
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{
                            color: themeColors.textTertiary,
                            '&:hover': { color: themeColors.purple },
                        }}
                    >
                        <MoreHoriz />
                    </IconButton>
                )}

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
                        onView?.(lote);
                    }}>
                        <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Visualizar</ListItemText>
                    </MenuItem>

                    {isOpen && (
                        <MenuItem onClick={() => {
                            setAnchorEl(null);
                            onClose?.(lote);
                        }}>
                            <ListItemIcon><LockIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>Fechar e Gerar XML</ListItemText>
                        </MenuItem>
                    )}

                    {hasXml && (
                        <MenuItem onClick={() => {
                            setAnchorEl(null);
                            onDownloadXml?.(lote);
                        }}>
                            <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>Baixar XML</ListItemText>
                        </MenuItem>
                    )}

                    {isOpen && (
                        <>
                            <Divider />
                            <MenuItem
                                onClick={() => {
                                    setAnchorEl(null);
                                    onDelete?.(lote);
                                }}
                                sx={{ color: themeColors.error }}
                            >
                                <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: themeColors.error }} /></ListItemIcon>
                                <ListItemText>Excluir</ListItemText>
                            </MenuItem>
                        </>
                    )}
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
                <PackageIcon sx={{ fontSize: 32, color: themeColors.textTertiary }} />
            </Box>
            <Typography variant="h6" fontWeight={600} color={themeColors.textPrimary}>
                Nenhum lote encontrado
            </Typography>
            <Typography variant="body2" color={themeColors.textSecondary} sx={{ maxWidth: 400, mt: 1 }}>
                {searchQuery
                    ? 'Nao encontramos lotes com esse criterio. Tente ajustar os filtros.'
                    : 'Crie um novo lote para agrupar e enviar suas guias.'}
            </Typography>
        </Box>
    );
}

/**
 * LotesList - Main component
 */
export default function LotesList({ searchQuery = '', onView, onCreate }) {
    const { lotes, loading, fetchLotes, fecharLote, downloadLoteXml, deleteLote, operadoras } = useTiss();

    const [statusFilter, setStatusFilter] = useState('');
    const [operadoraFilter, setOperadoraFilter] = useState('');

    useEffect(() => {
        fetchLotes({
            status: statusFilter || undefined,
            operadora_id: operadoraFilter || undefined,
        });
    }, [fetchLotes, statusFilter, operadoraFilter]);

    // Filter lotes based on search query
    const filteredLotes = useMemo(() => {
        if (!lotes) return [];
        let filtered = lotes;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((l) =>
                l.numero_lote?.toLowerCase().includes(query) ||
                l.operadora_nome?.toLowerCase().includes(query) ||
                l.numero?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [lotes, searchQuery]);

    const handleView = (lote) => {
        onView?.(lote);
    };

    const handleClose = async (lote) => {
        try {
            await fecharLote(lote.id, true);
        } catch (err) {
            console.error('Erro ao fechar lote:', err);
        }
    };

    const handleDownloadXml = async (lote) => {
        try {
            await downloadLoteXml(lote.id);
        } catch (err) {
            console.error('Erro ao baixar XML:', err);
        }
    };

    const handleDelete = async (lote) => {
        try {
            await deleteLote(lote.id);
        } catch (err) {
            console.error('Erro ao deletar lote:', err);
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
                        <MenuItem value="aberto">Aberto</MenuItem>
                        <MenuItem value="fechado">Fechado</MenuItem>
                        <MenuItem value="enviado">Enviado</MenuItem>
                        <MenuItem value="processando">Processando</MenuItem>
                        <MenuItem value="aceito">Aceito</MenuItem>
                        <MenuItem value="rejeitado">Rejeitado</MenuItem>
                        <MenuItem value="pago">Pago</MenuItem>
                    </Select>
                </FormControl>

                {operadoras && operadoras.length > 0 && (
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Operadora</InputLabel>
                        <Select
                            value={operadoraFilter}
                            label="Operadora"
                            onChange={(e) => setOperadoraFilter(e.target.value)}
                            sx={{ bgcolor: 'white', borderRadius: '10px' }}
                        >
                            <MenuItem value="">Todas</MenuItem>
                            {operadoras.map((op) => (
                                <MenuItem key={op.id} value={op.id}>
                                    {op.nome_fantasia}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </Box>

            {/* Lotes List */}
            {filteredLotes.length === 0 ? (
                <EmptyState searchQuery={searchQuery} />
            ) : (
                <Box>
                    {filteredLotes.map((lote) => (
                        <LoteRow
                            key={lote.id}
                            lote={lote}
                            onView={handleView}
                            onClose={handleClose}
                            onDownloadXml={handleDownloadXml}
                            onDelete={handleDelete}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}
