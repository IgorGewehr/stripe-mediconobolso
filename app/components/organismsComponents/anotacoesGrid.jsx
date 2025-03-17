"use client";
import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    IconButton,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../authProvider";
import FirebaseService from "../../../lib/FirebaseService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Paleta de cores (pode extrair para outro arquivo se quiser)
const themeColors = {
    primary: "#1852FE",
    textPrimary: "#111E5A",
    textSecondary: "#666",
    borderColor: "rgba(0, 0, 0, 0.10)",
};

// Botão para criar nova ficha
function CriarNovaFichaButton({ onClick }) {
    return (
        <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onClick}
            sx={{
                height: 46,
                padding: "0 24px",
                borderRadius: "99px",
                backgroundColor: themeColors.primary,
                color: "#FFF",
                fontFamily: "Gellix",
                fontSize: 14,
                fontWeight: 500,
                textTransform: "none",
                "&:hover": {
                    backgroundColor: "#0d47e0",
                },
            }}
        >
            Criar nova ficha
        </Button>
    );
}

// Card de cada anotação
function AnotacoesCard({ nota, onOpen }) {
    return (
        <Card
            sx={{
                width: "100%",
                borderRadius: "20px",
                border: `1px solid ${themeColors.borderColor}`,
                boxShadow: "0px 8px 24px 0px rgba(0, 0, 0, 0.04)",
                mb: 2,
                cursor: "pointer",
                "&:hover": {
                    boxShadow: "0px 12px 28px 0px rgba(0, 0, 0, 0.08)",
                    transform: "translateY(-2px)",
                    transition: "all 0.2s ease-in-out"
                },
            }}
            onClick={() => onOpen(nota)}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", width: "60%" }}>
                        {/* Consulta com bolinha azul */}
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <FiberManualRecordIcon sx={{ color: themeColors.primary, fontSize: 8, mr: 1 }} />
                            <Typography
                                variant="caption"
                                sx={{
                                    color: themeColors.textSecondary,
                                    fontFamily: "Gellix",
                                    fontSize: 12,
                                }}
                            >
                                Consulta: {nota.data}
                            </Typography>
                        </Box>

                        {/* Título */}
                        <Typography
                            variant="h6"
                            sx={{
                                color: themeColors.textPrimary,
                                fontFamily: "Gellix",
                                fontSize: 18,
                                fontWeight: 500,
                                mb: 1,
                            }}
                        >
                            {nota.titulo}
                        </Typography>

                        {/* Descrição */}
                        <Typography
                            variant="body2"
                            sx={{
                                color: themeColors.textSecondary,
                                fontFamily: "Gellix",
                                fontSize: 14,
                                mb: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                            }}
                        >
                            {nota.descricao}
                        </Typography>

                        {/* Criado em */}
                        <Typography
                            variant="caption"
                            sx={{
                                color: themeColors.textSecondary,
                                fontFamily: "Gellix",
                                fontSize: 12,
                                mt: "auto",
                            }}
                        >
                            Criado em {nota.criado}
                        </Typography>
                    </Box>

                    {/* Lado direito com botão +2 e anexo PDF */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {nota.quantidadeAnexos > 0 && (
                            <Box
                                sx={{
                                    backgroundColor: themeColors.primary,
                                    borderRadius: "50%",
                                    width: 32,
                                    height: 32,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#FFF",
                                    fontFamily: "Gellix",
                                    fontSize: 14,
                                    fontWeight: 500,
                                }}
                            >
                                +{nota.quantidadeAnexos}
                            </Box>
                        )}

                        {nota.anexo && (
                            <Box sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                maxWidth: "100px"
                            }}>
                                <Box
                                    sx={{
                                        backgroundColor: "#F5F5F5",
                                        borderRadius: "4px",
                                        p: 1,
                                        display: "flex",
                                        justifyContent: "center",
                                        mb: 0.5,
                                    }}
                                >
                                    <PictureAsPdfIcon sx={{ color: "#E74C3C", fontSize: 24 }} />
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: themeColors.textSecondary,
                                        fontFamily: "Gellix",
                                        fontSize: 12,
                                        textAlign: "center",
                                        width: "100%",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {nota.anexo.nome}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: themeColors.textSecondary,
                                        fontFamily: "Gellix",
                                        fontSize: 10,
                                    }}
                                >
                                    {nota.anexo.tamanho}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

// Componente de modal para nova anotação
function NovaAnotacaoModal({ open, handleClose, patientId, onSave }) {
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const handleSave = async () => {
        if (!titulo || !descricao) {
            // Validação simples
            alert("Por favor, preencha todos os campos");
            return;
        }

        if (!user || !user.uid || !patientId) {
            alert("Erro: Informações do usuário ou paciente ausentes");
            return;
        }

        setLoading(true);
        try {
            // Formatar data atual
            const hoje = format(new Date(), 'dd/MM/yyyy');
            const criadoEm = format(new Date(), "dd 'de' MMMM'/'yyyy", { locale: ptBR });

            // Criar objeto de anotação
            const novaNota = {
                titulo,
                descricao,
                data: hoje,
                createdAt: new Date(),
            };

            // Salvar no Firebase
            // Aqui você pode usar a função apropriada do seu FirebaseService
            // Exemplo: await FirebaseService.createAnamnese(user.uid, patientId, novaNota);

            // Simulando sucesso após 1 segundo
            setTimeout(() => {
                if (onSave) {
                    onSave({
                        id: Date.now(), // Temporário, seria substituído pelo ID do Firebase
                        ...novaNota,
                        criado: criadoEm
                    });
                }
                handleClose();
                setLoading(false);
                setTitulo('');
                setDescricao('');
            }, 1000);

        } catch (error) {
            console.error("Erro ao salvar anotação:", error);
            alert("Erro ao salvar a anotação. Tente novamente.");
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={loading ? null : handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: "20px",
                    p: 1
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontFamily: 'Gellix', fontWeight: 500 }}>
                    Nova Anotação
                </Typography>
                <IconButton onClick={handleClose} disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Título"
                    fullWidth
                    variant="outlined"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />
                <TextField
                    margin="dense"
                    label="Descrição"
                    multiline
                    rows={6}
                    fullWidth
                    variant="outlined"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    disabled={loading}
                />
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    disabled={loading}
                    sx={{
                        borderRadius: '99px',
                        textTransform: 'none'
                    }}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        borderRadius: '99px',
                        backgroundColor: themeColors.primary,
                        textTransform: 'none'
                    }}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {loading ? "Salvando..." : "Salvar"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// Dialog para visualizar anotação
function VisualizarAnotacaoDialog({ nota, open, handleClose }) {
    if (!nota) return null;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: "20px",
                    p: 1
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontFamily: 'Gellix', fontWeight: 500 }}>
                    {nota.titulo}
                </Typography>
                <IconButton onClick={handleClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
                    Consulta: {nota.data} • Criado em {nota.criado}
                </Typography>

                <Typography variant="body1" sx={{ mb: 3 }}>
                    {nota.descricao}
                </Typography>

                {nota.anexo && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <PictureAsPdfIcon sx={{ color: "#E74C3C", fontSize: 32 }} />
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {nota.anexo.nome}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {nota.anexo.tamanho}
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ ml: 'auto', borderRadius: '99px', textTransform: 'none' }}
                            >
                                Download
                            </Button>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    sx={{ borderRadius: '99px', textTransform: 'none' }}
                >
                    Fechar
                </Button>
                <Button
                    variant="contained"
                    sx={{
                        borderRadius: '99px',
                        backgroundColor: themeColors.primary,
                        textTransform: 'none'
                    }}
                >
                    Editar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// Seção de notas
export default function NotasSection({ notas = [], pacienteId }) {
    const [notasData, setNotasData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openNovaAnotacao, setOpenNovaAnotacao] = useState(false);
    const [selectedNota, setSelectedNota] = useState(null);
    const [openViewNota, setOpenViewNota] = useState(false);
    const { user } = useAuth();

    // Carregar notas do paciente
    useEffect(() => {
        if (notas.length > 0) {
            // Se já recebemos as notas como prop, usamos elas
            setNotasData(notas);
        } else if (pacienteId && user?.uid) {
            // Caso contrário, carregamos do Firebase
            const fetchNotas = async () => {
                try {
                    setLoading(true);
                    // Aqui você poderia carregar as anamneses ou outro tipo de anotação
                    // const anotacoesData = await FirebaseService.listAnamneses(user.uid, pacienteId);

                    // Como não temos a implementação real, usaremos dados de exemplo
                    // Transformar os dados recebidos no formato esperado pelo componente
                    // setNotasData(anotacoesData.map(...));

                    // Simulação de carregamento
                    setTimeout(() => {
                        setNotasData(notasExemplo);
                        setLoading(false);
                    }, 1000);
                } catch (error) {
                    console.error("Erro ao carregar anotações:", error);
                    setLoading(false);
                }
            };

            fetchNotas();
        }
    }, [notas, pacienteId, user]);

    const handleOpenNovaAnotacao = () => {
        setOpenNovaAnotacao(true);
    };

    const handleCloseNovaAnotacao = () => {
        setOpenNovaAnotacao(false);
    };

    const handleSaveAnotacao = (novaNota) => {
        setNotasData(prev => [novaNota, ...prev]);
    };

    const handleOpenViewNota = (nota) => {
        setSelectedNota(nota);
        setOpenViewNota(true);
    };

    const handleCloseViewNota = () => {
        setOpenViewNota(false);
    };

    // Dados de exemplo para testar
    const notasExemplo = [
        {
            id: 1,
            titulo: "Lorem Título 1",
            data: "23/11/2024",
            descricao: "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg conforme prescrição.",
            criado: "24 de Dezembro/2024",
            quantidadeAnexos: 2,
            anexo: {
                nome: "pas-nelio.pdf",
                tamanho: "74mb"
            }
        },
        {
            id: 2,
            titulo: "Lorem Título 2",
            data: "23/11/2024",
            descricao: "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg conforme prescrição.",
            criado: "24 de Dezembro/2024",
            quantidadeAnexos: 2,
            anexo: {
                nome: "pas-nelio.pdf",
                tamanho: "74mb"
            }
        },
        {
            id: 3,
            titulo: "Lorem Título 3",
            data: "23/11/2024",
            descricao: "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg conforme prescrição.",
            criado: "24 de Dezembro/2024",
            quantidadeAnexos: 2,
            anexo: {
                nome: "pas-nelio.pdf",
                tamanho: "74mb"
            }
        },
        {
            id: 4,
            titulo: "Lorem Título 4",
            data: "23/11/2024",
            descricao: "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg conforme prescrição.",
            criado: "24 de Dezembro/2024",
            quantidadeAnexos: 2,
            anexo: {
                nome: "pas-nelio.pdf",
                tamanho: "74mb"
            }
        }
    ];

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: "1000px",
                display: "flex",
                flexDirection: "column",
                height: "auto",
            }}
        >
            {/* Header: título e botão */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                    width: "100%",
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 26,
                        fontWeight: 500,
                    }}
                >
                    Anotações
                </Typography>
                <CriarNovaFichaButton onClick={handleOpenNovaAnotacao} />
            </Box>

            {/* Lista de notas - um card por linha */}
            <Box
                sx={{
                    width: "100%",
                    maxHeight: "300px",
                    overflowY: "auto",
                    paddingRight: 1,
                    // Estilos para a barra de rolagem
                    "&::-webkit-scrollbar": {
                        width: "6px",
                        borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "rgba(0,0,0,0.2)",
                        borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-track": {
                        backgroundColor: "rgba(0,0,0,0.05)",
                        borderRadius: "3px",
                    },
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : notasData.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1" color="textSecondary">
                            Nenhuma anotação encontrada para este paciente.
                        </Typography>
                        <Button
                            variant="text"
                            onClick={handleOpenNovaAnotacao}
                            sx={{ mt: 1, textTransform: 'none', color: themeColors.primary }}
                        >
                            Criar primeira anotação
                        </Button>
                    </Box>
                ) : (
                    notasData.map((nota) => (
                        <AnotacoesCard key={nota.id} nota={nota} onOpen={handleOpenViewNota} />
                    ))
                )}
            </Box>

            {/* Modal para nova anotação */}
            <NovaAnotacaoModal
                open={openNovaAnotacao}
                handleClose={handleCloseNovaAnotacao}
                patientId={pacienteId}
                onSave={handleSaveAnotacao}
            />

            {/* Dialog para visualizar anotação */}
            <VisualizarAnotacaoDialog
                nota={selectedNota}
                open={openViewNota}
                handleClose={handleCloseViewNota}
            />
        </Box>
    );
}