"use client";

import React, { useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Grid,
    IconButton,
    Tooltip,
    styled,
    CircularProgress,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// ------------------ ESTILOS ------------------
const SectionTitle = styled(Typography)(() => ({
    color: "#111E5A",
    fontFamily: "Gellix, sans-serif",
    fontSize: "16px",
    fontWeight: 500,
    lineHeight: "24px",
    textTransform: "uppercase",
    marginBottom: "12px",
}));

const StyledTextField = styled(TextField)(() => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: "16px",
        "& fieldset": {
            borderColor: "rgba(17, 30, 90, 0.30)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(17, 30, 90, 0.50)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#111E5A",
        },
    },
}));

const FileUploadBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== "$isdragover" && prop !== "$isUploading" && prop !== "$isUploaded",
})(({ $isdragover, $isUploading, $isUploaded }) => ({
    border: "1px dashed rgba(17, 30, 90, 0.30)",
    borderRadius: "16px",
    padding: "24px",
    backgroundColor: $isdragover
        ? "rgba(17, 30, 90, 0.08)"
        : $isUploaded
            ? "rgba(12, 175, 96, 0.05)"
            : "rgba(17, 30, 90, 0.05)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: $isUploading ? "default" : "pointer",
    transition: "all 0.2s ease",
    borderColor: $isUploaded ? "#0CAF60" : $isdragover ? "rgba(17, 30, 90, 0.5)" : "rgba(17, 30, 90, 0.30)",
    "&:hover": {
        backgroundColor: $isUploading
            ? "rgba(17, 30, 90, 0.05)"
            : $isUploaded
                ? "rgba(12, 175, 96, 0.08)"
                : "rgba(17, 30, 90, 0.08)",
    },
}));

const FilePreviewBox = styled(Box)(() => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "12px",
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid rgba(17, 30, 90, 0.20)",
    marginBottom: "8px",
}));

const FileTypeIndicator = styled(Box)(({ fileType }) => {
    const getColorByType = () => {
        switch (fileType?.toLowerCase()) {
            case "pdf":
                return "#FA5C5C";
            case "png":
            case "jpg":
            case "jpeg":
                return "#4CAF50";
            default:
                return "#2196F3";
        }
    };

    return {
        backgroundColor: getColorByType(),
        color: "white",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 8px",
        fontWeight: "bold",
        fontSize: "12px",
        marginRight: "12px",
    };
});

// -------------------------------------------------

const HistoricoCondutaForm = ({ formData, updateFormData, doctorId, patientId, onFileUpload }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploaded, setIsUploaded] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Mudanças de texto
    const handleChange = (e) => {
        const { name, value } = e.target;
        updateFormData({ [name]: value });
    };

    // Upload de arquivo com feedback visual melhorado
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Primeiro atualiza o estado local para mostrar o arquivo selecionado
            updateFormData({ arquivoAnexo: file });

            // Se estamos em modo de edição (tem doctorId e patientId)
            // e onFileUpload foi fornecido, fazemos o upload imediatamente
            if (doctorId && patientId && onFileUpload) {
                setIsUploading(true);
                setUploadProgress(0);

                const fakeProgress = setInterval(() => {
                    setUploadProgress(prev => {
                        const newProgress = prev + (100 - prev) * 0.1;
                        return newProgress > 95 ? 95 : newProgress;
                    });
                }, 200);

                try {
                    await onFileUpload(file);
                    clearInterval(fakeProgress);
                    setUploadProgress(100);
                    setIsUploaded(true);
                    setTimeout(() => {
                        setIsUploading(false);
                    }, 1000);
                } catch (error) {
                    clearInterval(fakeProgress);
                    console.error("Erro no upload:", error);
                    setIsUploading(false);
                    setUploadProgress(0);
                }
            }
        } catch (error) {
            console.error("Erro ao processar o arquivo:", error);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        if (!isUploading) {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        if (isUploading) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            handleFileUpload({ target: { files: [file] } });
        }
    };

    // Remover arquivo
    const handleRemoveFile = () => {
        updateFormData({ arquivoAnexo: null });
        setIsUploaded(false);
    };

    // Extensão do arquivo
    const getFileExtension = (filename) => {
        if (!filename) return "";
        return filename.split(".").pop().toUpperCase();
    };

    // Formata tamanho do arquivo
    const formatFileSize = (bytes) => {
        if (!bytes) return "";
        if (bytes < 1024) return bytes + " B";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        else return (bytes / 1048576).toFixed(1) + " MB";
    };

    return (
        <Box component="form" autoComplete="off">
            <Grid container spacing={3}>
                {/* Doenças Genéticas ou Hereditárias */}
                <Grid item xs={12}>
                    <SectionTitle>Doenças Genéticas ou Hereditárias</SectionTitle>
                    <StyledTextField
                        multiline
                        rows={4}
                        placeholder="Exemplo: Histórico familiar de diabetes tipo 2..."
                        name="doencasHereditarias"
                        value={formData.doencasHereditarias || ""}
                        onChange={handleChange}
                        fullWidth
                    />
                </Grid>

                {/* Conduta Inicial */}
                <Grid item xs={12}>
                    <SectionTitle>Conduta Inicial</SectionTitle>
                    <StyledTextField
                        multiline
                        rows={6}
                        placeholder="Exemplo: Solicitar exames, recomendar controle alimentar..."
                        name="condutaInicial"
                        value={formData.condutaInicial || ""}
                        onChange={handleChange}
                        fullWidth
                    />
                </Grid>

                {/* Anexo */}
                <Grid item xs={12}>
                    <SectionTitle>Anexo</SectionTitle>
                    <FileUploadBox
                        $isdragover={isDragOver}
                        $isUploading={isUploading}
                        $isUploaded={isUploaded}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !isUploading && document.getElementById("fileInput").click()}
                    >
                        <input
                            type="file"
                            id="fileInput"
                            style={{ display: "none" }}
                            onChange={handleFileUpload}
                            accept=".pdf,.png,.jpg,.jpeg"
                        />

                        {!formData.arquivoAnexo ? (
                            <>
                                <AttachFileIcon
                                    sx={{
                                        fontSize: 36,
                                        color: "#111E5A",
                                        transform: "rotate(45deg)",
                                        mb: 1,
                                    }}
                                />
                                <Typography
                                    sx={{
                                        color: "#111E5A",
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: "16px",
                                        textAlign: "center",
                                        fontWeight: 500,
                                    }}
                                >
                                    Arraste e solte arquivos aqui ou clique para anexar
                                </Typography>
                                <Typography
                                    sx={{
                                        color: "rgba(17, 30, 90, 0.60)",
                                        fontFamily: "Gellix, sans-serif",
                                        fontSize: "14px",
                                        textAlign: "center",
                                        mt: 1,
                                    }}
                                >
                                    PDF, JPEG, PNG (máx. 10MB)
                                </Typography>
                            </>
                        ) : (
                            <Box sx={{ width: "100%" }}>
                                <FilePreviewBox>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <FileTypeIndicator
                                            fileType={getFileExtension(formData.arquivoAnexo.name)}
                                        >
                                            {getFileExtension(formData.arquivoAnexo.name)}
                                        </FileTypeIndicator>
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography
                                                sx={{
                                                    color: "#111E5A",
                                                    fontFamily: "Gellix, sans-serif",
                                                    fontSize: "14px",
                                                    fontWeight: 500,
                                                    textOverflow: "ellipsis",
                                                    overflow: "hidden",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {formData.arquivoAnexo.name}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    color: "rgba(17, 30, 90, 0.60)",
                                                    fontFamily: "Gellix, sans-serif",
                                                    fontSize: "12px",
                                                }}
                                            >
                                                {formatFileSize(formData.arquivoAnexo.size)}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {isUploading ? (
                                        <CircularProgress
                                            size={24}
                                            variant="determinate"
                                            value={uploadProgress}
                                            sx={{ color: "#1852FE" }}
                                        />
                                    ) : isUploaded ? (
                                        <CheckCircleIcon sx={{ color: "#0CAF60" }} />
                                    ) : (
                                        <Tooltip title="Remover arquivo">
                                            <IconButton
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveFile();
                                                }}
                                                sx={{
                                                    color: "rgba(17, 30, 90, 0.60)",
                                                    "&:hover": {
                                                        color: "#FA5C5C",
                                                    },
                                                }}
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </FilePreviewBox>

                                {!isUploading && (
                                    <Typography
                                        sx={{
                                            color: "rgba(17, 30, 90, 0.60)",
                                            fontFamily: "Gellix, sans-serif",
                                            fontSize: "14px",
                                            textAlign: "center",
                                        }}
                                    >
                                        {isUploaded
                                            ? "Arquivo salvo com sucesso"
                                            : "Clique para substituir o arquivo"}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </FileUploadBox>
                </Grid>
            </Grid>
        </Box>
    );
};

export default HistoricoCondutaForm;