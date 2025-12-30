'use client';

/**
 * @fileoverview TISS Dashboard Component
 * @description Main dashboard for TISS/TUSS billing management
 * @design Inspired by modern billing dashboard patterns
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Tabs,
    Tab,
    Button,
    Chip,
    Skeleton,
    Alert,
    TextField,
    InputAdornment,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    alpha,
    Tooltip,
} from '@mui/material';
import {
    Description as GuiaIcon,
    Folder as LoteIcon,
    AttachMoney as MoneyIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Send as SendIcon,
    Gavel as GlossaIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    Schedule as ClockIcon,
    Inventory2 as PackageIcon,
} from '@mui/icons-material';
import { useTiss } from '../../hooks/useTiss';
import GuiasList from './GuiasList';
import LotesList from './LotesList';
import FinanceiroResumo from './FinanceiroResumo';
import { GlossasDashboard } from '../glossas';

// Theme colors matching the clinic management design
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
    indigo: '#6366F1',
    indigoLight: '#EEF2FF',
    textPrimary: '#111E5A',
    textSecondary: '#4B5574',
    textTertiary: '#7E84A3',
    backgroundPrimary: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    borderColor: 'rgba(17, 30, 90, 0.08)',
};

/**
 * StatCard - Modern statistics card with trend
 */
function StatCard({ title, value, subtitle, icon: Icon, colorClass, loading }) {
    const colorMap = {
        warning: { bg: themeColors.warningLight, icon: themeColors.warning },
        info: { bg: themeColors.infoLight, icon: themeColors.info },
        primary: { bg: themeColors.primaryLight, icon: themeColors.primary },
        success: { bg: themeColors.successLight, icon: themeColors.success },
        error: { bg: themeColors.errorLight, icon: themeColors.error },
        purple: { bg: themeColors.purpleLight, icon: themeColors.purple },
        indigo: { bg: themeColors.indigoLight, icon: themeColors.indigo },
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
                <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                    {loading ? (
                        <Skeleton variant="text" width={80} height={40} />
                    ) : (
                        <Typography variant="h4" fontWeight="bold" color={themeColors.textPrimary}>
                            {value}
                        </Typography>
                    )}
                    {subtitle && (
                        <Typography variant="caption" color={themeColors.textTertiary} sx={{ mt: 0.5 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

/**
 * TabPanel component
 */
function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tiss-tabpanel-${index}`}
            aria-labelledby={`tiss-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

/**
 * New Guia Dialog
 */
function NewGuiaDialog({ open, onClose, onCreate }) {
    const [tipo, setTipo] = useState('PS');
    const [beneficiario, setBeneficiario] = useState('');

    const handleCreate = () => {
        onCreate?.({ tipo, beneficiario });
        onClose();
        setTipo('PS');
        setBeneficiario('');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
            <DialogTitle sx={{ fontWeight: 600 }}>Criar Nova Guia</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Preencha as informacoes para criar uma nova guia de faturamento.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>Tipo de Guia</InputLabel>
                        <Select value={tipo} onChange={(e) => setTipo(e.target.value)} label="Tipo de Guia">
                            <MenuItem value="PS">PS - Profissional Saude</MenuItem>
                            <MenuItem value="SP">SP - Servico Profissional</MenuItem>
                            <MenuItem value="UR">UR - Urgencia/Emergencia</MenuItem>
                            <MenuItem value="PA">PA - Paciente Acidentario</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Beneficiario"
                        placeholder="Nome completo do paciente"
                        value={beneficiario}
                        onChange={(e) => setBeneficiario(e.target.value)}
                        fullWidth
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} variant="outlined">
                    Cancelar
                </Button>
                <Button onClick={handleCreate} variant="contained">
                    Criar Guia
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/**
 * New Lote Dialog
 */
function NewLoteDialog({ open, onClose, onCreate }) {
    const handleCreate = () => {
        onCreate?.();
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
            <DialogTitle sx={{ fontWeight: 600 }}>Criar Novo Lote</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Um novo lote sera criado para agrupar guias de faturamento.
                </Typography>
                <TextField
                    label="Observacoes"
                    placeholder="Adicione notas sobre este lote..."
                    multiline
                    rows={3}
                    fullWidth
                />
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} variant="outlined">
                    Cancelar
                </Button>
                <Button onClick={handleCreate} variant="contained">
                    Criar Lote
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/**
 * Main TISS Dashboard component
 */
export default function TissDashboard() {
    const { stats, loading, fetchStats, error, isEnabled, isDisabledMessage } = useTiss();
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [newGuiaOpen, setNewGuiaOpen] = useState(false);
    const [newLoteOpen, setNewLoteOpen] = useState(false);

    const loadStats = useCallback(() => {
        if (isEnabled) {
            fetchStats();
        }
    }, [fetchStats, isEnabled]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value || 0);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const totalGuias = stats?.guias?.total_guias || 0;
    const totalLotes = stats?.lotes?.total_lotes || 0;

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
                        Faturamento TISS/TUSS
                    </Typography>
                    <Typography variant="body1" color={themeColors.textSecondary} sx={{ mt: 0.5 }}>
                        Gerencie guias, lotes, faturamento e glosas em um so lugar.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Tooltip title="Atualizar dados">
                        <IconButton
                            onClick={loadStats}
                            disabled={loading}
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
                        onClick={() => setNewGuiaOpen(true)}
                        sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            py: 1.5,
                            boxShadow: `0 4px 14px ${alpha(themeColors.primary, 0.3)}`,
                        }}
                    >
                        Nova Guia
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<PackageIcon />}
                        onClick={() => setNewLoteOpen(true)}
                        sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            py: 1.5,
                            bgcolor: 'white',
                        }}
                    >
                        Novo Lote
                    </Button>
                </Box>
            </Box>

            {/* Module Status Alert */}
            {!isEnabled && isDisabledMessage && (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
                    {isDisabledMessage}
                </Alert>
            )}

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                    {error}
                </Alert>
            )}

            {/* Stats Row */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Guias Pendentes"
                        value={stats?.guias?.guias_pendentes || 0}
                        subtitle="Aguardando envio"
                        icon={ClockIcon}
                        colorClass="warning"
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Lotes Abertos"
                        value={stats?.lotes?.lotes_abertos || 0}
                        subtitle="Prontos para fechar"
                        icon={PackageIcon}
                        colorClass="info"
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Valor Enviado"
                        value={formatCurrency(stats?.lotes?.valor_total_enviado)}
                        subtitle="Aguardando processamento"
                        icon={SendIcon}
                        colorClass="indigo"
                        loading={loading}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <StatCard
                        title="Valor Recebido"
                        value={formatCurrency(stats?.lotes?.valor_total_recebido)}
                        subtitle={`${stats?.guias?.guias_pagas || 0} guias pagas`}
                        icon={CheckIcon}
                        colorClass="success"
                        loading={loading}
                    />
                </Grid>
            </Grid>

            {/* Main Content Card */}
            <Card
                elevation={0}
                sx={{
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: themeColors.borderColor,
                    bgcolor: alpha('#FFFFFF', 0.7),
                    backdropFilter: 'blur(10px)',
                    mt: 5
                }}
            >
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        gap: 2,
                        mb: 2,
                    }}>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            aria-label="TISS tabs"
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    minHeight: 48,
                                    borderRadius: '8px',
                                    mr: 1,
                                },
                                '& .Mui-selected': {
                                    color: themeColors.primary,
                                },
                            }}
                        >
                            <Tab
                                icon={<GuiaIcon sx={{ fontSize: 20 }} />}
                                iconPosition="start"
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Guias
                                        <Chip
                                            size="small"
                                            label={totalGuias}
                                            sx={{
                                                height: 20,
                                                fontSize: 12,
                                                bgcolor: activeTab === 0 ? alpha(themeColors.primary, 0.1) : themeColors.backgroundSecondary,
                                                color: activeTab === 0 ? themeColors.primary : themeColors.textSecondary,
                                            }}
                                        />
                                    </Box>
                                }
                            />
                            <Tab
                                icon={<PackageIcon sx={{ fontSize: 20 }} />}
                                iconPosition="start"
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        Lotes
                                        <Chip
                                            size="small"
                                            label={totalLotes}
                                            sx={{
                                                height: 20,
                                                fontSize: 12,
                                                bgcolor: activeTab === 1 ? alpha(themeColors.primary, 0.1) : themeColors.backgroundSecondary,
                                                color: activeTab === 1 ? themeColors.primary : themeColors.textSecondary,
                                            }}
                                        />
                                    </Box>
                                }
                            />
                            <Tab
                                icon={<MoneyIcon sx={{ fontSize: 20 }} />}
                                iconPosition="start"
                                label="Financeiro"
                            />
                            <Tab
                                icon={<GlossaIcon sx={{ fontSize: 20 }} />}
                                iconPosition="start"
                                label="Glosas"
                            />
                        </Tabs>

                        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' } }}>
                            <TextField
                                placeholder="Buscar guia ou paciente..."
                                size="small"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{
                                    width: { xs: '100%', md: 280 },
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
                            <IconButton
                                sx={{
                                    border: '1px solid',
                                    borderColor: themeColors.borderColor,
                                    borderRadius: '10px',
                                    bgcolor: 'white',
                                }}
                            >
                                <FilterIcon sx={{ color: themeColors.textTertiary }} />
                            </IconButton>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: { xs: 2, md: 3 }, minHeight: 400 }}>
                    <TabPanel value={activeTab} index={0}>
                        <GuiasList searchQuery={searchQuery} />
                    </TabPanel>

                    <TabPanel value={activeTab} index={1}>
                        <LotesList searchQuery={searchQuery} />
                    </TabPanel>

                    <TabPanel value={activeTab} index={2}>
                        <FinanceiroResumo />
                    </TabPanel>

                    <TabPanel value={activeTab} index={3}>
                        <GlossasDashboard embedded />
                    </TabPanel>
                </Box>
            </Card>

            {/* Dialogs */}
            <NewGuiaDialog
                open={newGuiaOpen}
                onClose={() => setNewGuiaOpen(false)}
                onCreate={(data) => {
                    console.log('Create guia:', data);
                    // TODO: Implement create guia
                }}
            />

            <NewLoteDialog
                open={newLoteOpen}
                onClose={() => setNewLoteOpen(false)}
                onCreate={() => {
                    console.log('Create lote');
                    // TODO: Implement create lote
                }}
            />
        </Box>
    );
}
