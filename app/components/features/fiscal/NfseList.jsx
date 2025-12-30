'use client';

/**
 * @fileoverview NfseList Component
 * @description List of NFSe (electronic invoices) with modern row design
 * @design Inspired by modern billing dashboard patterns
 */

import { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Chip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    LinearProgress,
    InputAdornment,
    Tooltip,
    Paper,
    Divider,
    alpha,
    Grid,
    Card,
    CardContent,
    Skeleton,
} from '@mui/material';
import {
    Receipt as NfseIcon,
    Search as SearchIcon,
    Visibility as ViewIcon,
    Download as DownloadIcon,
    Cancel as CancelIcon,
    MoreHoriz,
    Refresh as RefreshIcon,
    Code as XmlIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { useNfse, useNfseXml } from '../../hooks/useNfse';

// Theme colors matching the billing dashboard design
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
    emitida: { label: 'Emitida', bg: themeColors.successLight, text: themeColors.success },
    processando: { label: 'Processando', bg: themeColors.infoLight, text: themeColors.info },
    rascunho: { label: 'Rascunho', bg: '#F1F5F9', text: '#64748B' },
    cancelada: { label: 'Cancelada', bg: themeColors.errorLight, text: themeColors.error },
    erro: { label: 'Erro', bg: themeColors.errorLight, text: themeColors.error },
};

// Format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value || 0);
};

// Format date
const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
};

/**
 * StatCard - Modern statistics card
 */
function StatCard({ title, value, icon: Icon, colorClass, loading }) {
    const colorMap = {
        primary: { bg: themeColors.primaryLight, icon: themeColors.primary },
        success: { bg: themeColors.successLight, icon: themeColors.success },
        error: { bg: themeColors.errorLight, icon: themeColors.error },
        warning: { bg: themeColors.warningLight, icon: themeColors.warning },
    };

    const colors = colorMap[colorClass] || colorMap.primary;

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: '16px',
                border: '1px solid',
                borderColor: themeColors.borderColor,
                height: '100%',
                transition: 'all 0.2s ease',
                '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)',
                },
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2 }}>
                    <Typography variant="body2" color={themeColors.textSecondary} fontWeight={500}>
                        {title}
                    </Typography>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.bg,
                        }}
                    >
                        <Icon sx={{ color: colors.icon, fontSize: 20 }} />
                    </Box>
                </Box>
                {loading ? (
                    <Skeleton variant="text" width={80} height={40} />
                ) : (
                    <Typography variant="h4" fontWeight="bold" color={themeColors.textPrimary}>
                        {value}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * NfseRow - Modern NFSe row component
 */
function NfseRow({ nfse, onViewXml, onCancel }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const statusConfig = STATUS_CONFIG[nfse.status] || STATUS_CONFIG.rascunho;

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
                        bgcolor: themeColors.successLight,
                    }}
                >
                    <NfseIcon sx={{ color: themeColors.success, fontSize: 22 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                            NFSe #{nfse.numero || 'Pendente'}
                        </Typography>
                        {nfse.codigo_verificacao && (
                            <Chip
                                size="small"
                                label={nfse.codigo_verificacao}
                                sx={{
                                    height: 20,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    fontFamily: 'monospace',
                                    bgcolor: '#F1F5F9',
                                    color: '#64748B',
                                }}
                            />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 14, color: themeColors.textTertiary }} />
                            <Typography variant="body2" color={themeColors.textSecondary}>
                                {nfse.tomador_nome || 'Tomador nao informado'}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color={themeColors.textTertiary}>•</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: 14, color: themeColors.textTertiary }} />
                            <Typography variant="body2" color={themeColors.textSecondary}>
                                {formatDate(nfse.data_emissao)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle1" fontWeight={600} color={themeColors.textPrimary}>
                        {formatCurrency(nfse.valor_servicos)}
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
                        onViewXml?.(nfse);
                    }}>
                        <ListItemIcon><XmlIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Ver XML</ListItemText>
                    </MenuItem>
                    <MenuItem>
                        <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Baixar PDF</ListItemText>
                    </MenuItem>
                    {nfse.status === 'emitida' && (
                        <>
                            <Divider />
                            <MenuItem
                                onClick={() => {
                                    setAnchorEl(null);
                                    onCancel?.(nfse);
                                }}
                                sx={{ color: themeColors.error }}
                            >
                                <ListItemIcon><CancelIcon fontSize="small" sx={{ color: themeColors.error }} /></ListItemIcon>
                                <ListItemText>Cancelar NFSe</ListItemText>
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
                <NfseIcon sx={{ fontSize: 32, color: themeColors.textTertiary }} />
            </Box>
            <Typography variant="h6" fontWeight={600} color={themeColors.textPrimary}>
                Nenhuma NFSe encontrada
            </Typography>
            <Typography variant="body2" color={themeColors.textSecondary} sx={{ maxWidth: 400, mt: 1 }}>
                {searchQuery
                    ? 'Nao encontramos NFSe com esse criterio. Tente buscar diferente.'
                    : 'As notas fiscais emitidas aparecerao aqui.'}
            </Typography>
        </Box>
    );
}

// Cancel Dialog
function CancelDialog({ open, onClose, onConfirm, isLoading }) {
    const [motivo, setMotivo] = useState('');

    const handleConfirm = () => {
        if (motivo.trim()) {
            onConfirm(motivo);
            setMotivo('');
        }
    };

    const handleClose = () => {
        setMotivo('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
            <DialogTitle sx={{ fontWeight: 600 }}>Cancelar NFSe</DialogTitle>
            <DialogContent>
                <Alert severity="warning" sx={{ mb: 3, borderRadius: '10px' }}>
                    O cancelamento de NFSe e uma operacao irreversivel e sera enviado para a prefeitura.
                </Alert>
                <TextField
                    label="Motivo do Cancelamento"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    required
                    placeholder="Informe o motivo do cancelamento..."
                />
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleClose} variant="outlined">
                    Voltar
                </Button>
                <Button
                    onClick={handleConfirm}
                    color="error"
                    variant="contained"
                    disabled={!motivo.trim() || isLoading}
                >
                    {isLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// XML View Dialog
function XmlDialog({ open, onClose, nfseId }) {
    const { data, isLoading } = useNfseXml(open ? nfseId : null);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
            <DialogTitle sx={{ fontWeight: 600 }}>XML da NFSe</DialogTitle>
            <DialogContent>
                {isLoading ? (
                    <LinearProgress />
                ) : (
                    <Box
                        component="pre"
                        sx={{
                            bgcolor: 'grey.100',
                            p: 2,
                            borderRadius: '12px',
                            overflow: 'auto',
                            maxHeight: 400,
                            fontSize: '0.75rem',
                        }}
                    >
                        {data?.xml || 'XML nao disponivel'}
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} variant="outlined">
                    Fechar
                </Button>
                {data?.xml && (
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => {
                            const blob = new Blob([data.xml], { type: 'application/xml' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `nfse-${nfseId}.xml`;
                            a.click();
                        }}
                    >
                        Download XML
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

// Main Component
export default function NfseList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNfse, setSelectedNfse] = useState(null);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [xmlOpen, setXmlOpen] = useState(false);

    const {
        nfses,
        total,
        isLoading,
        error,
        refetch,
        cancelar,
        isCanceling,
    } = useNfse();

    const handleCancelClick = (nfse) => {
        setSelectedNfse(nfse);
        setCancelOpen(true);
    };

    const handleCancelConfirm = async (motivo) => {
        try {
            await cancelar({ id: selectedNfse.id, motivo });
            setCancelOpen(false);
            setSelectedNfse(null);
        } catch (err) {
            console.error('Erro ao cancelar:', err);
        }
    };

    const handleXmlClick = (nfse) => {
        setSelectedNfse(nfse);
        setXmlOpen(true);
    };

    // Filter NFSes
    const filteredNfses = useMemo(() => {
        if (!nfses) return [];
        if (!searchTerm) return nfses;
        const search = searchTerm.toLowerCase();
        return nfses.filter((nfse) =>
            nfse.numero?.toString().includes(search) ||
            nfse.codigo_verificacao?.toLowerCase().includes(search) ||
            nfse.tomador_nome?.toLowerCase().includes(search)
        );
    }, [nfses, searchTerm]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalEmitidas = nfses?.filter(n => n.status === 'emitida').length || 0;
        const totalValor = nfses?.reduce((sum, n) => sum + (n.valor_servicos || 0), 0) || 0;
        const totalCanceladas = nfses?.filter(n => n.status === 'cancelada').length || 0;
        return { totalEmitidas, totalValor, totalCanceladas, total: nfses?.length || 0 };
    }, [nfses]);

    if (error) {
        return <Alert severity="error" sx={{ borderRadius: '12px' }}>Erro ao carregar NFSes: {error.message}</Alert>;
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: themeColors.backgroundSecondary, p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 2,
                mb: 4
            }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" color={themeColors.textPrimary}>
                        Notas Fiscais (NFSe)
                    </Typography>
                    <Typography variant="body1" color={themeColors.textSecondary} sx={{ mt: 0.5 }}>
                        Gerencie suas notas fiscais de servico eletronicas.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Tooltip title="Atualizar dados">
                        <IconButton
                            onClick={() => refetch()}
                            disabled={isLoading}
                            sx={{
                                bgcolor: 'white',
                                border: '1px solid',
                                borderColor: themeColors.borderColor,
                                '&:hover': { bgcolor: themeColors.backgroundSecondary },
                            }}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            py: 1.5,
                            boxShadow: `0 4px 14px ${alpha(themeColors.primary, 0.3)}`,
                        }}
                    >
                        Emitir NFSe
                    </Button>
                </Box>
            </Box>

            {/* Stats Row */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Total de NFSe"
                        value={stats.total}
                        icon={NfseIcon}
                        colorClass="primary"
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="NFSe Emitidas"
                        value={stats.totalEmitidas}
                        icon={NfseIcon}
                        colorClass="success"
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Valor Total"
                        value={formatCurrency(stats.totalValor)}
                        icon={NfseIcon}
                        colorClass="primary"
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Canceladas"
                        value={stats.totalCanceladas}
                        icon={CancelIcon}
                        colorClass="error"
                        loading={isLoading}
                    />
                </Grid>
            </Grid>

            {/* Search */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    placeholder="Buscar por numero, codigo ou tomador..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                        width: { xs: '100%', md: 350 },
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                            bgcolor: 'white',
                        },
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: themeColors.textTertiary }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {/* List */}
            {isLoading ? (
                <LinearProgress sx={{ borderRadius: '10px' }} />
            ) : filteredNfses.length === 0 ? (
                <EmptyState searchQuery={searchTerm} />
            ) : (
                <Box>
                    {filteredNfses.map((nfse) => (
                        <NfseRow
                            key={nfse.id}
                            nfse={nfse}
                            onViewXml={handleXmlClick}
                            onCancel={handleCancelClick}
                        />
                    ))}
                </Box>
            )}

            {/* Dialogs */}
            <CancelDialog
                open={cancelOpen}
                onClose={() => setCancelOpen(false)}
                onConfirm={handleCancelConfirm}
                isLoading={isCanceling}
            />
            <XmlDialog
                open={xmlOpen}
                onClose={() => {
                    setXmlOpen(false);
                    setSelectedNfse(null);
                }}
                nfseId={selectedNfse?.id}
            />
        </Box>
    );
}
