// InfoBasicasForm.jsx (atualizado)
"use client";

import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
    Box,
    Grid,
    Typography,
    TextField,
    MenuItem,
    FormControl,
    styled,
    Button,
    Avatar,
    InputAdornment,
    Tooltip,
    CircularProgress,
    Backdrop,
    Paper,
    alpha,
    LinearProgress,
    Snackbar,
    Alert,
    Fade,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';

// ------------------ ESTILOS ------------------
const FormLabel = styled(Typography)(() => ({
    color: "#111E5A",
    fontWeight: 500,
    fontSize: "14px",
    marginBottom: "8px",
}));

const StyledTextField = styled(TextField)(() => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: "999px",
        backgroundColor: "#FFFFFF",
        "& fieldset": {
            border: "1px solid rgba(17, 30, 90, 0.30)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(17, 30, 90, 0.50)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#111E5A",
        },
    },
    "& .MuiInputBase-input": {
        padding: "12px 16px",
    },
}));

const StyledSelect = styled(TextField)(() => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: "999px",
        backgroundColor: "#FFFFFF",
        "& fieldset": {
            border: "1px solid rgba(17, 30, 90, 0.30)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(17, 30, 90, 0.50)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#111E5A",
        },
    },
    "& .MuiInputBase-input": {
        padding: "12px 16px",
    },
}));

const GenderButton = styled(Button)(({ selected }) => ({
    borderRadius: "999px",
    backgroundColor: selected ? "#E8EAF6" : "#FFFFFF",
    border: `1px solid ${selected ? "#111E5A" : "rgba(17, 30, 90, 0.30)"}`,
    color: "#111E5A",
    textTransform: "none",
    padding: "10px 16px",
    "&:hover": {
        backgroundColor: selected ? "#E8EAF6" : "#F9FAFB",
        borderColor: selected ? "#111E5A" : "#D1D5DB",
    },
    width: "100%",
    justifyContent: "flex-start",
}));

const PhotoUploadButton = styled(Button)(() => ({
    borderRadius: "16px",
    border: "1px dashed rgba(17, 30, 90, 0.30)",
    backgroundColor: "#FFFFFF",
    color: "#111E5A",
    textTransform: "none",
    padding: "12px 16px",
    "&:hover": {
        backgroundColor: "#F9FAFB",
        borderColor: "#D1D5DB",
    },
    width: "100%",
    height: "100px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
}));

// Botão AI para extração de dados
const AIExtractButton = styled(Button)(({ theme }) => ({
    borderRadius: '999px',
    backgroundColor: '#1852FE',
    color: '#FFFFFF',
    textTransform: 'none',
    padding: '8px 16px',
    fontWeight: 600,
    boxShadow: '0 2px 4px rgba(24, 82, 254, 0.25)',
    '&:hover': {
        backgroundColor: '#0A3AA8',
        boxShadow: '0 4px 8px rgba(24, 82, 254, 0.35)',
    },
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
}));

// Função para formatar a data de nascimento
const formatBirthDate = (value) => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "").slice(0, 8);
    let formatted = "";
    if (digits.length > 0) {
        formatted = digits.substring(0, 2);
    }
    if (digits.length >= 3) {
        formatted += "/" + digits.substring(2, 4);
    }
    if (digits.length >= 5) {
        formatted += "/" + digits.substring(4, 8);
    }
    return formatted;
};

function InfoBasicasForm({ formData = {}, updateFormData, errors = {}, resetTrigger = 0 }) {
    const [photoPreview, setPhotoPreview] = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [currentProcessingFile, setCurrentProcessingFile] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [showTips, setShowTips] = useState(false);
    const fileInputRef = useRef(null);

    // Dicas de processamento para extração de dados
    const extractionTips = [
        "Os melhores resultados são obtidos com documentos ou imagens nítidas e bem iluminadas.",
        "A IA extrai apenas as informações que estão presentes no documento.",
        "Documentos digitais geralmente produzem melhores resultados que documentos escaneados.",
        "Fichas de paciente, prontuários ou formulários de cadastro são ideais para extração.",
        "Os campos reconhecidos são: nome, email, telefone, tipo sanguíneo, gênero, data de nascimento, endereço, CPF, cidade, estado e CEP.",
        "Você pode editar quaisquer dados extraídos antes de salvar o paciente.",
        "Se você tiver um formulário de referência com estrutura específica, o sistema se adaptará após algumas extrações."
    ];

    useEffect(() => {
        if (resetTrigger > 0) {
            setPhotoPreview(null);
        }
    }, [resetTrigger]);

    // Exibir notificações
    const showNotification = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateFormData({ [name]: value });
    };

    const handleGenderChange = (gender) => {
        updateFormData({ genero: gender });
    };

    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setPhotoPreview(event.target.result);
                updateFormData({ patientPhoto: file });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBirthDateChange = (e) => {
        const { value } = e.target;
        const formatted = formatBirthDate(value);
        updateFormData({ dataNascimento: formatted });
    };

    const formatCPF = (value) => {
        if (!value) return "";
        const digits = value.replace(/\D/g, "").slice(0, 11);
        let formatted = digits.substring(0, Math.min(3, digits.length));
        if (digits.length >= 4) {
            formatted += "." + digits.substring(3, Math.min(6, digits.length));
        }
        if (digits.length >= 7) {
            formatted += "." + digits.substring(6, Math.min(9, digits.length));
        }
        if (digits.length >= 10) {
            formatted += "-" + digits.substring(9, Math.min(11, digits.length));
        }
        return formatted;
    };

    const handleCPFChange = (e) => {
        const { value } = e.target;
        updateFormData({ cpf: formatCPF(value) });
    };

    const formatTelefone = (value) => {
        if (!value) return "";
        const digits = value.replace(/\D/g, "").slice(0, 11);
        let formatted = "";
        if (digits.length > 0) {
            formatted = "(" + digits.substring(0, Math.min(2, digits.length));
        }
        if (digits.length >= 3) {
            formatted += ") " + digits.substring(2, Math.min(7, digits.length));
        }
        if (digits.length >= 8) {
            formatted += "-" + digits.substring(7, Math.min(11, digits.length));
        }
        return formatted;
    };

    const handleTelefoneChange = (e) => {
        const { value } = e.target;
        updateFormData({ telefone: formatTelefone(value) });
    };

    const formatCEP = (value) => {
        if (!value) return "";
        const digits = value.replace(/\D/g, "").slice(0, 8);
        let formatted = digits.substring(0, Math.min(5, digits.length));
        if (digits.length > 5) {
            formatted += "-" + digits.substring(5, Math.min(8, digits.length));
        }
        return formatted;
    };

    const handleCEPChange = (e) => {
        const { value } = e.target;
        updateFormData({ cep: formatCEP(value) });
    };

    // Detectar tipo de arquivo
    const detectFileType = (file) => {
        try {
            if (!file) return { isPdf: false, isDocx: false, isImage: false, isSupported: false };

            const fileName = file.fileName || file.name || '';
            const fileType = file.fileType || file.type || '';
            const fileExt = fileName.toLowerCase().split('.').pop();

            const isPdf = fileType === 'application/pdf' || fileExt === 'pdf';
            const isDocx = fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                fileExt === 'docx' || fileExt === 'doc';
            const isImage = fileType.startsWith('image/') ||
                ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt);

            return {
                isPdf,
                isDocx,
                isImage,
                isSupported: isPdf || isDocx || isImage
            };
        } catch (error) {
            console.error("Erro ao detectar tipo de arquivo:", error);
            return { isPdf: false, isDocx: false, isImage: false, isSupported: false };
        }
    };

    // Iniciar processo de extração de dados
    const handleStartExtraction = () => {
        // Abrir diálogo de seleção de arquivo
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Processar arquivo selecionado para extração
    const handleFileInputChange = async (e) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;

            const file = e.target.files[0];
            const { isSupported, isPdf, isDocx, isImage } = detectFileType(file);

            if (!isSupported) {
                showNotification("Por favor, selecione um arquivo PDF, DOCX ou imagem válida", "warning");
                return;
            }

            setIsExtracting(true);
            setCurrentProcessingFile(file.name);
            setProcessingProgress(0);

            // Simular progresso
            const progressInterval = setInterval(() => {
                setProcessingProgress(prev => {
                    const newProgress = prev + (Math.random() * 2);
                    return newProgress >= 90 ? 90 : newProgress;
                });
            }, 300);

            try {
                // Preparar FormData
                const formData = new FormData();
                formData.append('file', file);
                formData.append('extractType', 'patientInfo'); // Indicar que queremos extrair dados do paciente

                // Chamar a API
                const response = await fetch('/api/exame', {
                    method: 'POST',
                    body: formData,
                });

                clearInterval(progressInterval);
                setProcessingProgress(100);

                // Pequeno atraso para mostrar progress 100%
                await new Promise(resolve => setTimeout(resolve, 500));

                if (!response.ok) {
                    let errorMessage = "Erro ao processar arquivo";
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorData.details || `Erro na API: ${response.status}`;
                    } catch (jsonError) {
                        errorMessage = `Erro no servidor: ${response.status}`;
                    }
                    throw new Error(errorMessage);
                }

                const result = await response.json();

                if (result.success && result.data) {
                    // Atualizar o formulário com os dados extraídos
                    updateFormData(result.data);

                    // Contar campos extraídos
                    const fieldsExtracted = Object.keys(result.data).length;

                    if (fieldsExtracted > 0) {
                        showNotification(`Extração concluída! ${fieldsExtracted} campos preenchidos.`, "success");
                    } else {
                        showNotification("Nenhuma informação encontrada no documento.", "warning");
                    }
                } else if (result.warning) {
                    showNotification(result.warning, "warning");
                } else {
                    throw new Error("Falha ao processar o resultado");
                }
            } catch (error) {
                console.error('Erro ao processar o arquivo:', error);
                showNotification(`Não foi possível processar o arquivo: ${error.message}`, "error");
            } finally {
                clearInterval(progressInterval);
                setIsExtracting(false);
                setCurrentProcessingFile(null);
                setProcessingProgress(0);

                // Limpar o input para permitir selecionar o mesmo arquivo novamente
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        } catch (globalError) {
            console.error("Erro global ao processar arquivo:", globalError);
            showNotification("Ocorreu um erro inesperado. Por favor, tente novamente.", "error");
            setIsExtracting(false);
            setCurrentProcessingFile(null);
            setProcessingProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Function para scanear documento
    const handleScanDocument = () => {
        showNotification("Funcionalidade de escaneamento será implementada em breve!", "info");
    };

    return (
        <Box component="form" autoComplete="off" sx={{ p: 2, position: 'relative' }}>
            {/* Input de arquivo oculto para extração de dados */}
            <input
                type="file"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.bmp,.webp"
            />

            {/* Backdrop para processamento */}
            <Backdrop
                open={isExtracting}
                sx={{
                    position: 'fixed',
                    zIndex: 9999,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: '16px',
                        maxWidth: '420px',
                        textAlign: 'center'
                    }}
                >
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            backgroundColor: alpha('#1852FE', 0.2),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            animation: 'pulse 1.5s infinite'
                        }}
                    >
                        <AutoAwesomeIcon
                            sx={{
                                fontSize: 40,
                                color: '#1852FE',
                            }}
                        />
                    </Box>

                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#0A3AA8' }}>
                        Extraindo Dados
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 3, color: '#475467' }}>
                        {currentProcessingFile}
                    </Typography>

                    <Box sx={{ width: '100%', mb: 2 }}>
                        <LinearProgress
                            variant="determinate"
                            value={processingProgress}
                            sx={{
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: alpha('#1852FE', 0.2),
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: '#1852FE',
                                    borderRadius: 5
                                }
                            }}
                        />
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                        {`${Math.round(processingProgress)}% - Analisando documento...`}
                    </Typography>

                    <Box sx={{ mt: 3, fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
                        A IA está identificando e extraindo informações do documento
                    </Box>
                </Paper>
            </Backdrop>

            {/* Animação de pulso para efeitos visuais */}
            <style jsx global>{`
                @keyframes pulse {
                    0% {
                        filter: drop-shadow(0 0 0 #1852FE);
                        transform: scale(1);
                    }
                    50% {
                        filter: drop-shadow(0 0 10px rgba(24, 82, 254, 0.4));
                        transform: scale(1.1);
                    }
                    100% {
                        filter: drop-shadow(0 0 0 #1852FE);
                        transform: scale(1);
                    }
                }
            `}</style>


            {/* Mostrar dicas quando habilitado */}
            {showTips && (
                <Fade in={showTips}>
                    <Box sx={{
                        mb: 3,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha('#1852FE', 0.05),
                        border: '1px solid',
                        borderColor: alpha('#1852FE', 0.2)
                    }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#0A3AA8' }}>
                            Como funciona a extração de dados de pacientes
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                <Box sx={{
                                    display: 'flex',
                                    borderRadius: '50%',
                                    p: 0.5,
                                    bgcolor: alpha('#1852FE', 0.1),
                                    minWidth: 32,
                                    height: 32,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mt: 0.5
                                }}>
                                    <InsertDriveFileOutlinedIcon fontSize="small" sx={{ color: '#1852FE' }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#344054' }}>
                                        1. Selecione um arquivo
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#475467' }}>
                                        Envie um documento PDF, DOCX ou uma imagem contendo dados do paciente
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                <Box sx={{
                                    display: 'flex',
                                    borderRadius: '50%',
                                    p: 0.5,
                                    bgcolor: alpha('#1852FE', 0.1),
                                    minWidth: 32,
                                    height: 32,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mt: 0.5
                                }}>
                                    <AutoAwesomeIcon fontSize="small" sx={{ color: '#1852FE' }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#344054' }}>
                                        2. A IA processa o documento
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#475467' }}>
                                        Nossa IA analisa o documento e extrai as informações relevantes
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <Box sx={{
                                    display: 'flex',
                                    borderRadius: '50%',
                                    p: 0.5,
                                    bgcolor: alpha('#1852FE', 0.1),
                                    minWidth: 32,
                                    height: 32,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mt: 0.5
                                }}>
                                    <FileDownloadDoneIcon fontSize="small" sx={{ color: '#1852FE' }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#344054' }}>
                                        3. Formulário preenchido automaticamente
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#475467' }}>
                                        Os campos são preenchidos com as informações extraídas
                                    </Typography>
                                </Box>
                            </Box>

                            <Typography variant="caption" sx={{ mt: 2, fontStyle: 'italic', color: '#475467' }}>
                                Verifique e ajuste os dados extraídos se necessário antes de salvar o paciente
                            </Typography>
                        </Box>
                    </Box>
                </Fade>
            )}

            {/* Alternativa para extração de dados */}
            <Box sx={{
                position: 'relative',
                maxHeight: showTips ? '0' : '200px',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease-in-out',
                mb: showTips ? 0 : 3
            }}>
                <Fade in={!showTips} timeout={300}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha('#1852FE', 0.05),
                        border: '1px dashed',
                        borderColor: alpha('#1852FE', 0.3),
                        alignItems: 'center',
                        position: 'absolute',
                        width: '100%',
                        opacity: showTips ? 0 : 1
                    }}>
                        <Typography variant="body2" sx={{ color: '#344054', fontWeight: 500 }}>
                            Economize tempo! Extraia automaticamente as informações do paciente de documentos ou imagens.
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                            <Button
                                variant="outlined"
                                onClick={handleScanDocument}
                                startIcon={<CameraAltOutlinedIcon />}
                                sx={{
                                    borderRadius: '999px',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    color: '#475467',
                                    borderColor: '#D0D5DD',
                                    '&:hover': {
                                        borderColor: '#B0B7C3',
                                        backgroundColor: 'rgba(208, 213, 221, 0.1)'
                                    }
                                }}
                            >
                                Escanear
                            </Button>

                            <Button
                                variant="contained"
                                onClick={handleStartExtraction}
                                startIcon={<AttachFileOutlinedIcon />}
                                sx={{
                                    borderRadius: '999px',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    backgroundColor: '#1852FE',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        backgroundColor: '#0A3AA8',
                                        boxShadow: '0 2px 4px rgba(10, 58, 168, 0.2)'
                                    }
                                }}
                            >
                                Selecionar Arquivo
                            </Button>
                        </Box>
                    </Box>
                </Fade>
            </Box>

            {/* Foto do Paciente */}
            <Box sx={{ mb: 3 }}>
                <input type="text" name="dummy" style={{ display: "none" }} autoComplete="off" />

                <FormLabel>Foto do Paciente</FormLabel>
                <input
                    type="file"
                    accept="image/*"
                    id="foto-paciente"
                    style={{ display: "none" }}
                    onChange={handlePhotoChange}
                />
                <label htmlFor="foto-paciente">
                    {photoPreview ? (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                                src={photoPreview}
                                alt="Foto do paciente"
                                sx={{ width: 80, height: 80, mr: 2 }}
                            />
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<AddPhotoAlternateIcon />}
                                sx={{
                                    borderRadius: "999px",
                                    textTransform: "none",
                                    border: "1px solid rgba(17, 30, 90, 0.30)",
                                    color: "#111E5A",
                                }}
                            >
                                Alterar foto
                            </Button>
                        </Box>
                    ) : (
                        <PhotoUploadButton component="span">
                            <AddPhotoAlternateIcon sx={{ fontSize: 24, mb: 1 }} />
                            <Typography variant="body2">
                                Clique para adicionar uma foto
                            </Typography>
                        </PhotoUploadButton>
                    )}
                </label>
            </Box>

            <Grid container spacing={2}>
                {/* PRIMEIRA LINHA: Nome, Email e Telefone */}
                <Grid item xs={12} sm={4}>
                    <FormLabel>Nome Completo*</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="nome"
                        autoComplete="new-password"
                        name="nome"
                        placeholder="Digite seu nome completo"
                        value={formData?.nome || ""}
                        onChange={handleChange}
                        error={!!errors.nome}
                        helperText={errors.nome}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormLabel>Email</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="email"
                        name="email"
                        autoComplete="new-password"
                        placeholder="contato@paciente.com"
                        value={formData?.email || ""}
                        onChange={handleChange}
                        variant="outlined"
                        error={!!errors.email}
                        helperText={errors.email}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon sx={{ color: "#9CA3AF" }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormLabel>Telefone</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="telefone"
                        autoComplete="new-password"
                        name="telefone"
                        placeholder="(00) 00000-0000"
                        value={formData?.telefone || ""}
                        onChange={handleTelefoneChange}
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PhoneIcon sx={{ color: "#9CA3AF" }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>

                {/* SEGUNDA LINHA: Tipo Sanguíneo, Gênero e Data de Nascimento */}
                <Grid item xs={12} sm={4}>
                    <FormLabel>Tipo Sanguíneo</FormLabel>
                    <FormControl fullWidth>
                        <StyledSelect
                            select
                            id="tipoSanguineo"
                            name="tipoSanguineo"
                            value={formData?.tipoSanguineo || ""}
                            onChange={handleChange}
                        >
                            <MenuItem value="" disabled>
                                Selecione um...
                            </MenuItem>
                            <MenuItem value="A+">A+</MenuItem>
                            <MenuItem value="A-">A-</MenuItem>
                            <MenuItem value="B+">B+</MenuItem>
                            <MenuItem value="B-">B-</MenuItem>
                            <MenuItem value="AB+">AB+</MenuItem>
                            <MenuItem value="AB-">AB-</MenuItem>
                            <MenuItem value="O+">O+</MenuItem>
                            <MenuItem value="O-">O-</MenuItem>
                        </StyledSelect>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormLabel>Gênero</FormLabel>
                    <Grid container spacing={1}>
                        <Grid item xs={6}>
                            <GenderButton
                                onClick={() => handleGenderChange("masculino")}
                                selected={formData?.genero === "masculino"}
                                startIcon={<MaleIcon />}
                            >
                                Masculino
                            </GenderButton>
                        </Grid>
                        <Grid item xs={6}>
                            <GenderButton
                                onClick={() => handleGenderChange("feminino")}
                                selected={formData?.genero === "feminino"}
                                startIcon={<FemaleIcon />}
                            >
                                Feminino
                            </GenderButton>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="dataNascimento"
                        name="dataNascimento"
                        placeholder="DD/MM/AAAA"
                        value={formData?.dataNascimento || ""}
                        onChange={handleBirthDateChange}
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <CalendarTodayIcon sx={{ color: "#9CA3AF" }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>

                {/* TERCEIRA LINHA: Endereço e CPF */}
                <Grid item xs={12} sm={6}>
                    <FormLabel>Endereço</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="endereco"
                        name="endereco"
                        autoComplete="new-password"
                        placeholder="Digite seu endereço"
                        value={formData?.endereco || ""}
                        onChange={handleChange}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormLabel>CPF</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="cpf"
                        autoComplete="new-password"
                        name="cpf"
                        placeholder="000.000.000-00"
                        value={formData?.cpf || ""}
                        onChange={handleCPFChange}
                        variant="outlined"
                    />
                </Grid>

                {/* QUARTA LINHA: Cidade, Estado e CEP */}
                <Grid item xs={12} sm={4}>
                    <FormLabel>Cidade</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="cidade"
                        name="cidade"
                        autoComplete="new-password"
                        placeholder="Digite o nome da cidade"
                        value={formData?.cidade || ""}
                        onChange={handleChange}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormLabel>Estado</FormLabel>
                    <FormControl fullWidth>
                        <StyledSelect
                            select
                            id="estado"
                            name="estado"
                            value={formData?.estado || ""}
                            onChange={handleChange}
                        >
                            <MenuItem value="" disabled>
                                Selecione um...
                            </MenuItem>
                            <MenuItem value="AC">Acre</MenuItem>
                            <MenuItem value="AL">Alagoas</MenuItem>
                            <MenuItem value="AP">Amapá</MenuItem>
                            <MenuItem value="AM">Amazonas</MenuItem>
                            <MenuItem value="BA">Bahia</MenuItem>
                            <MenuItem value="CE">Ceará</MenuItem>
                            <MenuItem value="DF">Distrito Federal</MenuItem>
                            <MenuItem value="ES">Espírito Santo</MenuItem>
                            <MenuItem value="GO">Goiás</MenuItem>
                            <MenuItem value="MA">Maranhão</MenuItem>
                            <MenuItem value="MT">Mato Grosso</MenuItem>
                            <MenuItem value="MS">Mato Grosso do Sul</MenuItem>
                            <MenuItem value="MG">Minas Gerais</MenuItem>
                            <MenuItem value="PA">Pará</MenuItem>
                            <MenuItem value="PB">Paraíba</MenuItem>
                            <MenuItem value="PR">Paraná</MenuItem>
                            <MenuItem value="PE">Pernambuco</MenuItem>
                            <MenuItem value="PI">Piauí</MenuItem>
                            <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                            <MenuItem value="RN">Rio Grande do Norte</MenuItem>
                            <MenuItem value="RS">Rio Grande do Sul</MenuItem>
                            <MenuItem value="RO">Rondônia</MenuItem>
                            <MenuItem value="RR">Roraima</MenuItem>
                            <MenuItem value="SC">Santa Catarina</MenuItem>
                            <MenuItem value="SP">São Paulo</MenuItem>
                            <MenuItem value="SE">Sergipe</MenuItem>
                            <MenuItem value="TO">Tocantins</MenuItem>
                        </StyledSelect>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormLabel>CEP</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="cep"
                        name="cep"
                        autoComplete="new-password"
                        placeholder="00000-000"
                        value={formData?.cep || ""}
                        onChange={handleCEPChange}
                        variant="outlined"
                    />
                </Grid>
            </Grid>

            {/* Notificações */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        fontWeight: 500
                    }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}

// Adicione o ícone que faltava
const FileDownloadDoneIcon = (props) => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M5 12.8L8.5 16.3L19 5.8M5 19H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default InfoBasicasForm;