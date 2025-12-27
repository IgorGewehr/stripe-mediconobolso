"use client";

import React, { useState, useEffect } from "react";
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
    FormControlLabel
} from "@mui/material";
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    AdminPanelSettings as AdminIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { adminService } from '@/lib/services/api';
import { useAuth } from "../providers/authProvider";

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
    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersData = await adminService.listAllUsers(100, null, searchQuery);
            setUsers(usersData);
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
        } finally {
            setLoading(false);
        }
    };

    // Carregar dados na inicialização
    useEffect(() => {
        if (currentUser?.administrador) {
            loadUsers();
        }
    }, [currentUser]);

    // Recarregar ao alterar a pesquisa
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length === 0 || searchQuery.length > 2) {
                loadUsers();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

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
        color: "#111E5A",
        backgroundColor: "#F0F4FF",
        borderBottom: "2px solid #E0E7FF",
    };

    return (
        <Box sx={{ padding: { xs: 2, md: 3 }, maxWidth: "100%" }}>
            {/* Toolbar com ações e pesquisa */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={loadUsers}
                    sx={{
                        borderColor: "#4285F4",
                        color: "#4285F4",
                        "&:hover": {
                            borderColor: "#1a73e8",
                            backgroundColor: "rgba(66, 133, 244, 0.04)",
                        },
                    }}
                >
                    Atualizar
                </Button>

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
                                <SearchIcon sx={{ color: "#4285F4", fontSize: 20 }} />
                            </InputAdornment>
                        ),
                        sx: {
                            borderRadius: "8px",
                            backgroundColor: "#FFFFFF",
                            "& fieldset": {
                                borderColor: "#E0E7FF",
                            },
                            "&:hover fieldset": {
                                borderColor: "#4285F4",
                            },
                        },
                    }}
                />
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
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <Typography>Carregando dados...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <Typography>Nenhum usuário encontrado</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((user) => (
                                        <TableRow
                                            hover
                                            key={user.id}
                                            sx={{
                                                "&:hover": { backgroundColor: "rgba(66, 133, 244, 0.04)" },
                                                cursor: "pointer"
                                            }}
                                        >
                                            {/* Usuário */}
                                            <TableCell>
                                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                                    <Avatar
                                                        src={user.photoURL}
                                                        alt={user.fullName}
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            mr: 2,
                                                            border: user.isAdmin ? "2px solid #4285F4" : "none"
                                                        }}
                                                    >
                                                        {user.fullName.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography
                                                            variant="body1"
                                                            sx={{ fontWeight: 600, color: "#111E5A", display: "flex", alignItems: "center" }}
                                                        >
                                                            {user.fullName}
                                                            {user.isAdmin && (
                                                                <AdminIcon
                                                                    sx={{
                                                                        color: "#4285F4",
                                                                        fontSize: "16px",
                                                                        ml: 1,
                                                                    }}
                                                                />
                                                            )}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{ color: "#8A94A6" }}
                                                        >
                                                            {user.cpf || "CPF não cadastrado"}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            {/* Email */}
                                            <TableCell>
                                                <Typography variant="body2">{user.email}</Typography>
                                            </TableCell>

                                            {/* Telefone */}
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {user.phone || "Não informado"}
                                                </Typography>
                                            </TableCell>

                                            {/* Localização */}
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {user.city ? `${user.city}${user.state ? `, ${user.state}` : ''}` : "Não informado"}
                                                </Typography>
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell>
                                                <Chip
                                                    label={user.assinouPlano ? "Plano Ativo" : "Sem Plano"}
                                                    color={user.assinouPlano ? "primary" : "default"}
                                                    size="small"
                                                    sx={{
                                                        borderRadius: "6px",
                                                        backgroundColor: user.assinouPlano
                                                            ? "rgba(66, 133, 244, 0.1)"
                                                            : "rgba(138, 148, 166, 0.1)",
                                                        color: user.assinouPlano ? "#4285F4" : "#8A94A6",
                                                        fontWeight: 500,
                                                    }}
                                                />
                                            </TableCell>

                                            {/* Ações */}
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        borderColor: "#E0E7FF",
                                                        color: "#4285F4",
                                                        "&:hover": {
                                                            borderColor: "#4285F4",
                                                            backgroundColor: "rgba(66, 133, 244, 0.04)",
                                                        },
                                                    }}
                                                >
                                                    Gerenciar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
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
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600, color: "#111E5A" }}>
                    Gerenciar Usuário
                </DialogTitle>
                <DialogContent>
                    {selectedUser && (
                        <>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                                <Avatar
                                    src={selectedUser.photoURL}
                                    alt={selectedUser.fullName}
                                    sx={{ width: 56, height: 56, mr: 2 }}
                                >
                                    {selectedUser.fullName.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: "#111E5A" }}>
                                        {selectedUser.fullName}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: "#8A94A6" }}>
                                        {selectedUser.email}
                                    </Typography>
                                </Box>
                            </Box>

                            <DialogContentText sx={{ mb: 3 }}>
                                Altere as permissões do usuário abaixo:
                            </DialogContentText>

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isAdmin}
                                        onChange={(e) => setIsAdmin(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                        {isAdmin ? (
                                            <AdminIcon sx={{ color: "#4285F4", mr: 1 }} />
                                        ) : (
                                            <PersonIcon sx={{ color: "#8A94A6", mr: 1 }} />
                                        )}
                                        <Typography>
                                            {isAdmin ? "Administrador" : "Usuário Padrão"}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={handleCloseDialog}
                        sx={{
                            color: "#8A94A6",
                            "&:hover": {
                                backgroundColor: "rgba(138, 148, 166, 0.04)",
                            }
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleUpdateAdminStatus}
                        variant="contained"
                        sx={{
                            backgroundColor: "#4285F4",
                            "&:hover": {
                                backgroundColor: "#1a73e8",
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