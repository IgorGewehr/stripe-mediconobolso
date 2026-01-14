"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Avatar,
    Chip,
    TextField,
    InputAdornment,
    IconButton,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Switch,
    FormControlLabel,
    Skeleton,
    alpha,
    Tooltip
} from "@mui/material";
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    AdminPanelSettings as AdminIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    Edit as EditIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import { adminService } from '@/lib/services/api';
import { useAuth } from "../providers/authProvider";

// Cores do tema
const themeColors = {
    primary: "#1852FE",
    primaryLight: "#E9EFFF",
    success: "#0CAF60",
    error: "#FF4B55",
    warning: "#FFAB2B",
    textPrimary: "#111E5A",
    textSecondary: "#4B5574",
    textTertiary: "#7E84A3",
    backgroundSecondary: "#F4F7FF",
    borderColor: "rgba(17, 30, 90, 0.08)",
};

// Helper para obter nome seguro
const getSafeName = (user) => {
    return user?.fullName || user?.email?.split('@')[0] || 'Usuário';
};

// Helper para obter inicial segura
const getSafeInitial = (user) => {
    const name = getSafeName(user);
    return name.charAt(0).toUpperCase();
};

// Helper para obter localização formatada
const getFormattedLocation = (user) => {
    const city = user?.city || user?.address?.city;
    const state = user?.state || user?.address?.state;

    if (!city && !state) return null;
    if (city && state) return `${city}, ${state}`;
    return city || state;
};

const UserDataTemplate = () => {
    // Estados para controle da tabela e dados
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Obter dados do usuário autenticado
    const { user: currentUser } = useAuth();

    // Carregar dados dos usuários
    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            // Dados já normalizados pelo admin.service
            const usersData = await adminService.listAllUsers(100, null, searchQuery);
            setUsers(usersData || []);
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    // Carregar dados na inicialização
    useEffect(() => {
        if (currentUser?.administrador) {
            loadUsers();
        }
    }, [currentUser, loadUsers]);

    // Recarregar ao alterar a pesquisa (debounced)
    useEffect(() => {
        if (!currentUser?.administrador) return;

        const timer = setTimeout(() => {
            if (searchQuery.length === 0 || searchQuery.length > 2) {
                loadUsers();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, currentUser?.administrador, loadUsers]);

    // Handlers para a tabela
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handler para abrir o diálogo de edição
    const handleOpenDialog = (user) => {
        setSelectedUser(user);
        setIsAdmin(user.isAdmin);
        setOpenDialog(true);
    };

    // Handler para fechar o diálogo
    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedUser(null);
    };

    // Handler para atualizar o status de administrador
    const handleUpdateAdminStatus = async () => {
        if (!selectedUser) return;

        try {
            await adminService.updateUserAdminStatus(selectedUser.id, isAdmin);
            // Atualizar o usuário na lista local
            setUsers(users.map(user =>
                user.id === selectedUser.id ? { ...user, isAdmin: isAdmin } : user
            ));
            handleCloseDialog();
        } catch (error) {
            console.error("Erro ao atualizar status de administrador:", error);
        }
    };

    // Estilo para a célula de cabeçalho da tabela
    const headerCellStyle = {
        fontWeight: 600,
        color: themeColors.textPrimary,
        backgroundColor: themeColors.backgroundSecondary,
        borderBottom: `2px solid ${themeColors.borderColor}`,
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        py: 1.5
    };

    // Se não é admin, não renderizar
    if (!currentUser?.administrador) {
        return (
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
                flexDirection: 'column',
                gap: 2
            }}>
                <AdminIcon sx={{ fontSize: 64, color: themeColors.textTertiary, opacity: 0.3 }} />
                <Typography sx={{ color: themeColors.textTertiary }}>
                    Acesso restrito a administradores
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ padding: { xs: 2, md: 3 }, maxWidth: "100%" }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography sx={{
                    fontSize: { xs: "1.25rem", md: "1.5rem" },
                    fontWeight: 700,
                    color: themeColors.textPrimary,
                    mb: 0.5
                }}>
                    Gerenciamento de Usuários
                </Typography>
                <Typography sx={{
                    fontSize: "14px",
                    color: themeColors.textTertiary
                }}>
                    {users.length > 0 ? `${users.length} usuário${users.length > 1 ? 's' : ''} cadastrado${users.length > 1 ? 's' : ''}` : 'Carregando...'}
                </Typography>
            </Box>

            {/* Toolbar com ações e pesquisa */}
            <Box sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                mb: 3,
                flexWrap: "wrap",
                p: 2,
                borderRadius: "12px",
                backgroundColor: "#FFFFFF",
                border: `1px solid ${themeColors.borderColor}`
            }}>
                <TextField
                    sx={{ flex: 1, minWidth: 200 }}
                    size="small"
                    variant="outlined"
                    placeholder="Pesquisar por nome ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: themeColors.textTertiary, fontSize: 20 }} />
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: "10px",
                            backgroundColor: themeColors.backgroundSecondary,
                            "& fieldset": {
                                borderColor: "transparent",
                            },
                            "&:hover fieldset": {
                                borderColor: themeColors.primary,
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: themeColors.primary,
                            }
                        },
                    }}
                />

                <Tooltip title="Atualizar lista">
                    <IconButton
                        onClick={loadUsers}
                        disabled={loading}
                        sx={{
                            backgroundColor: alpha(themeColors.primary, 0.1),
                            color: themeColors.primary,
                            "&:hover": {
                                backgroundColor: alpha(themeColors.primary, 0.2),
                            },
                        }}
                    >
                        <RefreshIcon sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Tabela de usuários */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid #E0E7FF",
                    mb: 3
                }}
            >
                <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
                    <Table stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={headerCellStyle}>Usuário</TableCell>
                                <TableCell sx={headerCellStyle}>Email</TableCell>
                                <TableCell sx={headerCellStyle}>Telefone</TableCell>
                                <TableCell sx={headerCellStyle}>Localização</TableCell>
                                <TableCell sx={headerCellStyle}>Status</TableCell>
                                <TableCell sx={headerCellStyle}>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                // Skeleton loading
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={`skeleton-${index}`}>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                                <Skeleton variant="circular" width={40} height={40} />
                                                <Box>
                                                    <Skeleton width={120} height={20} />
                                                    <Skeleton width={80} height={16} />
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell><Skeleton width={150} /></TableCell>
                                        <TableCell><Skeleton width={100} /></TableCell>
                                        <TableCell><Skeleton width={100} /></TableCell>
                                        <TableCell><Skeleton width={80} /></TableCell>
                                        <TableCell><Skeleton width={80} /></TableCell>
                                    </TableRow>
                                ))
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <PersonIcon sx={{ fontSize: 48, color: themeColors.textTertiary, opacity: 0.5, mb: 1 }} />
                                        <Typography sx={{ color: themeColors.textTertiary }}>
                                            {searchQuery ? 'Nenhum usuário encontrado para esta busca' : 'Nenhum usuário cadastrado'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((user) => {
                                        const location = getFormattedLocation(user);
                                        return (
                                            <TableRow
                                                hover
                                                key={user.id}
                                                onClick={() => handleOpenDialog(user)}
                                                sx={{
                                                    "&:hover": { backgroundColor: alpha(themeColors.primary, 0.04) },
                                                    cursor: "pointer",
                                                    transition: "background-color 0.2s ease"
                                                }}
                                            >
                                                {/* Usuário */}
                                                <TableCell>
                                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                                        <Avatar
                                                            src={user.photoURL}
                                                            alt={getSafeName(user)}
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                                mr: 2,
                                                                border: user.isAdmin ? `2px solid ${themeColors.primary}` : "none",
                                                                backgroundColor: alpha(themeColors.primary, 0.1),
                                                                color: themeColors.primary,
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            {getSafeInitial(user)}
                                                        </Avatar>
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    color: themeColors.textPrimary,
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    fontSize: "14px"
                                                                }}
                                                            >
                                                                {getSafeName(user)}
                                                                {user.isAdmin && (
                                                                    <Tooltip title="Administrador">
                                                                        <AdminIcon
                                                                            sx={{
                                                                                color: themeColors.primary,
                                                                                fontSize: "16px",
                                                                                ml: 0.5,
                                                                            }}
                                                                        />
                                                                    </Tooltip>
                                                                )}
                                                            </Typography>
                                                            <Typography
                                                                sx={{
                                                                    color: themeColors.textTertiary,
                                                                    fontSize: "12px"
                                                                }}
                                                            >
                                                                {user.cpf || "CPF não cadastrado"}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>

                                                {/* Email */}
                                                <TableCell>
                                                    <Typography sx={{ fontSize: "13px", color: themeColors.textSecondary }}>
                                                        {user.email || "—"}
                                                    </Typography>
                                                </TableCell>

                                                {/* Telefone */}
                                                <TableCell>
                                                    <Typography sx={{ fontSize: "13px", color: themeColors.textSecondary }}>
                                                        {user.phone || "—"}
                                                    </Typography>
                                                </TableCell>

                                                {/* Localização */}
                                                <TableCell>
                                                    <Typography sx={{ fontSize: "13px", color: themeColors.textSecondary }}>
                                                        {location || "—"}
                                                    </Typography>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell>
                                                    <Chip
                                                        label={user.assinouPlano ? "Plano Ativo" : "Gratuito"}
                                                        size="small"
                                                        sx={{
                                                            borderRadius: "6px",
                                                            backgroundColor: user.assinouPlano
                                                                ? alpha(themeColors.success, 0.1)
                                                                : alpha(themeColors.textTertiary, 0.1),
                                                            color: user.assinouPlano ? themeColors.success : themeColors.textTertiary,
                                                            fontWeight: 500,
                                                            fontSize: "12px",
                                                            height: 24
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* Ações */}
                                                <TableCell>
                                                    <Tooltip title="Gerenciar usuário">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenDialog(user);
                                                            }}
                                                            sx={{
                                                                color: themeColors.primary,
                                                                "&:hover": {
                                                                    backgroundColor: alpha(themeColors.primary, 0.08),
                                                                },
                                                            }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Paginação */}
                <TablePagination
                    component="div"
                    count={users.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    labelRowsPerPage="Linhas por página:"
                    labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} de ${count}`
                    }
                    sx={{
                        borderTop: "1px solid #E0E7FF",
                        "& .MuiTablePagination-select": {
                            borderRadius: "8px",
                            mr: 1,
                        },
                    }}
                />
            </Paper>

            {/* Diálogo para editar usuário */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: "16px",
                        overflow: "hidden"
                    }
                }}
            >
                <DialogTitle sx={{
                    fontWeight: 600,
                    color: themeColors.textPrimary,
                    borderBottom: `1px solid ${themeColors.borderColor}`,
                    pb: 2
                }}>
                    Gerenciar Usuário
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {selectedUser && (
                        <>
                            {/* Header do usuário */}
                            <Box sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 3,
                                p: 2,
                                borderRadius: "12px",
                                backgroundColor: themeColors.backgroundSecondary
                            }}>
                                <Avatar
                                    src={selectedUser.photoURL}
                                    alt={getSafeName(selectedUser)}
                                    sx={{
                                        width: 56,
                                        height: 56,
                                        mr: 2,
                                        backgroundColor: alpha(themeColors.primary, 0.1),
                                        color: themeColors.primary,
                                        fontWeight: 600,
                                        fontSize: "1.25rem"
                                    }}
                                >
                                    {getSafeInitial(selectedUser)}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{
                                        fontWeight: 600,
                                        color: themeColors.textPrimary,
                                        fontSize: "1.1rem",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5
                                    }}>
                                        {getSafeName(selectedUser)}
                                        {selectedUser.isAdmin && (
                                            <Chip
                                                label="Admin"
                                                size="small"
                                                sx={{
                                                    height: 20,
                                                    fontSize: "10px",
                                                    backgroundColor: alpha(themeColors.primary, 0.1),
                                                    color: themeColors.primary,
                                                    fontWeight: 600
                                                }}
                                            />
                                        )}
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                                        <EmailIcon sx={{ fontSize: 14, color: themeColors.textTertiary }} />
                                        <Typography sx={{ color: themeColors.textSecondary, fontSize: "13px" }}>
                                            {selectedUser.email || "—"}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Informações do usuário */}
                            <Box sx={{ mb: 3 }}>
                                <Typography sx={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: themeColors.textTertiary,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    mb: 1.5
                                }}>
                                    Informações
                                </Typography>
                                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                                    <Box>
                                        <Typography sx={{ fontSize: "11px", color: themeColors.textTertiary }}>
                                            Telefone
                                        </Typography>
                                        <Typography sx={{ fontSize: "14px", color: themeColors.textPrimary, fontWeight: 500 }}>
                                            {selectedUser.phone || "—"}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: "11px", color: themeColors.textTertiary }}>
                                            Localização
                                        </Typography>
                                        <Typography sx={{ fontSize: "14px", color: themeColors.textPrimary, fontWeight: 500 }}>
                                            {getFormattedLocation(selectedUser) || "—"}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: "11px", color: themeColors.textTertiary }}>
                                            CPF
                                        </Typography>
                                        <Typography sx={{ fontSize: "14px", color: themeColors.textPrimary, fontWeight: 500 }}>
                                            {selectedUser.cpf || "—"}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: "11px", color: themeColors.textTertiary }}>
                                            Status do Plano
                                        </Typography>
                                        <Chip
                                            label={selectedUser.assinouPlano ? "Plano Ativo" : "Gratuito"}
                                            size="small"
                                            sx={{
                                                mt: 0.5,
                                                height: 22,
                                                fontSize: "11px",
                                                backgroundColor: selectedUser.assinouPlano
                                                    ? alpha(themeColors.success, 0.1)
                                                    : alpha(themeColors.textTertiary, 0.1),
                                                color: selectedUser.assinouPlano ? themeColors.success : themeColors.textTertiary,
                                                fontWeight: 500
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Box>

                            {/* Permissões */}
                            <Box sx={{
                                p: 2,
                                borderRadius: "12px",
                                border: `1px solid ${themeColors.borderColor}`
                            }}>
                                <Typography sx={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: themeColors.textTertiary,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    mb: 1.5
                                }}>
                                    Permissões
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={isAdmin}
                                            onChange={(e) => setIsAdmin(e.target.checked)}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: themeColors.primary,
                                                },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: themeColors.primary,
                                                },
                                            }}
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: "flex", alignItems: "center" }}>
                                            {isAdmin ? (
                                                <AdminIcon sx={{ color: themeColors.primary, mr: 1, fontSize: 20 }} />
                                            ) : (
                                                <PersonIcon sx={{ color: themeColors.textTertiary, mr: 1, fontSize: 20 }} />
                                            )}
                                            <Box>
                                                <Typography sx={{ fontSize: "14px", fontWeight: 500, color: themeColors.textPrimary }}>
                                                    {isAdmin ? "Administrador" : "Usuário Padrão"}
                                                </Typography>
                                                <Typography sx={{ fontSize: "12px", color: themeColors.textTertiary }}>
                                                    {isAdmin ? "Acesso total ao sistema" : "Acesso limitado às suas próprias informações"}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    }
                                    sx={{ ml: 0 }}
                                />
                            </Box>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2, borderTop: `1px solid ${themeColors.borderColor}` }}>
                    <Button
                        onClick={handleCloseDialog}
                        sx={{
                            color: themeColors.textSecondary,
                            textTransform: "none",
                            fontWeight: 500,
                            "&:hover": {
                                backgroundColor: alpha(themeColors.textTertiary, 0.08),
                            }
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleUpdateAdminStatus}
                        variant="contained"
                        sx={{
                            backgroundColor: themeColors.primary,
                            textTransform: "none",
                            fontWeight: 500,
                            borderRadius: "8px",
                            px: 3,
                            "&:hover": {
                                backgroundColor: alpha(themeColors.primary, 0.9),
                            }
                        }}
                    >
                        Salvar Alterações
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserDataTemplate;