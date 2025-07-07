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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Paper,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

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

// Colors
const themeColors = {
    primary: "#1852FE",
    primaryLight: "#E9EFFF",
    primaryDark: "#0A3AA8",
    success: "#0CAF60",
    error: "#FF4B55",
    warning: "#FFAB2B",
    textPrimary: "#111E5A",
    textSecondary: "#4B5574",
    textTertiary: "#7E84A3",
    lightBg: "#F1F3FA",
    backgroundPrimary: "#FFFFFF",
    backgroundSecondary: "#F4F7FF",
    borderColor: "rgba(17, 30, 90, 0.1)",
    shadowColor: "rgba(17, 30, 90, 0.05)",
};

// Tipos de planos de saúde
const healthPlanTypes = [
    "Básico",
    "Intermediário",
    "Premium",
    "Corporativo",
    "Familiar",
    "Completo",
    "Individual",
    "Odontológico",
    "Hospitalar",
    "Ambulatorial",
    "Outro"
];

// Health Plan Form Dialog
const HealthPlanFormDialog = ({ open, onClose, onSave, plan }) => {
    const [localPlan, setLocalPlan] = useState(plan || {
        name: "",
        number: "",
        validUntil: "",
        type: ""
    });

    const handleChange = (field) => (e) => {
        const value = e.target.value;
        setLocalPlan(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        onSave(localPlan);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '20px',
                    padding: '10px'
                }
            }}
        >
            <DialogTitle sx={{
                fontFamily: 'Gellix, sans-serif',
                fontSize: '18px',
                color: themeColors.textPrimary
            }}>
                {plan?.id ? "Editar Plano de Saúde" : "Adicionar Plano de Saúde"}
            </DialogTitle>

            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Nome do Plano"
                            value={localPlan.name || ""}
                            onChange={handleChange('name')}
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{
                                '& .MuiInputLabel-root': {
                                    color: themeColors.textTertiary,
                                    fontFamily: 'Gellix, sans-serif',
                                    fontSize: '13px',
                                },
                                '& .MuiInputBase-input': {
                                    fontFamily: 'Gellix, sans-serif',
                                    fontSize: '14px',
                                    color: themeColors.textPrimary,
                                }
                            }}
                            InputProps={{
                                sx: {
                                    borderRadius: '10px',
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Número do Plano"
                            value={localPlan.number || ""}
                            onChange={handleChange('number')}
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{
                                '& .MuiInputLabel-root': {
                                    color: themeColors.textTertiary,
                                    fontFamily: 'Gellix, sans-serif',
                                    fontSize: '13px',
                                },
                                '& .MuiInputBase-input': {
                                    fontFamily: 'Gellix, sans-serif',
                                    fontSize: '14px',
                                    color: themeColors.textPrimary,
                                }
                            }}
                            InputProps={{
                                sx: {
                                    borderRadius: '10px',
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Data de Validade"
                            type="date"
                            value={localPlan.validUntil || ""}
                            onChange={handleChange('validUntil')}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            sx={{
                                '& .MuiInputLabel-root': {
                                    color: themeColors.textTertiary,
                                    fontFamily: 'Gellix, sans-serif',
                                    fontSize: '13px',
                                },
                                '& .MuiInputBase-input': {
                                    fontFamily: 'Gellix, sans-serif',
                                    fontSize: '14px',
                                    color: themeColors.textPrimary,
                                }
                            }}
                            InputProps={{
                                sx: {
                                    borderRadius: '10px',
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="plan-type-label">Tipo de Plano</InputLabel>
                            <Select
                                labelId="plan-type-label"
                                value={localPlan.type || ""}
                                onChange={handleChange('type')}
                                label="Tipo de Plano"
                                sx={{
                                    borderRadius: '10px',
                                    '& .MuiSelect-select': {
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '14px',
                                        color: themeColors.textPrimary,
                                    }
                                }}
                            >
                                <MenuItem value="">
                                    <em>Selecione um tipo</em>
                                </MenuItem>
                                {healthPlanTypes.map((type) => (
                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ padding: '0 24px 20px 24px' }}>
                <Button
                    onClick={onClose}
                    sx={{
                        fontFamily: 'Gellix, sans-serif',
                        textTransform: 'none',
                        color: themeColors.textSecondary,
                        borderRadius: '8px',
                        '&:hover': {
                            backgroundColor: themeColors.lightBg,
                        }
                    }}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    sx={{
                        fontFamily: 'Gellix, sans-serif',
                        textTransform: 'none',
                        backgroundColor: themeColors.primary,
                        color: 'white',
                        borderRadius: '8px',
                        '&:hover': {
                            backgroundColor: themeColors.primaryDark,
                        }
                    }}
                >
                    Salvar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// Generate a color for health plan based on plan name
const getHealthPlanColor = (planName, index) => {
    const planColors = [
        {bg: "#E5F8FF", color: "#1C94E0", border: "#A8DCFF"},
        {bg: "#E9EFFF", color: "#1852FE", border: "#B9C8FF"},
        {bg: "#EFE6FF", color: "#7B4BC9", border: "#D3BDFF"},
        {bg: "#FFF4E5", color: "#FFAB2B", border: "#FFD89E"},
        {bg: "#E5FFF2", color: "#0CAF60", border: "#A8FFCF"}
    ];

    // Use index first for consistent colors across plans
    if (index < planColors.length) {
        return planColors[index];
    }

    // If more than available colors, generate from name
    const hash = planName?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return planColors[hash % planColors.length];
};

// Formatação segura para datas
const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    try {
        // Checar se é um Timestamp do Firestore (com seconds e nanoseconds)
        if (dateValue.seconds) {
            return new Date(dateValue.seconds * 1000).toLocaleDateString();
        }

        // Checar se é um objeto Date
        if (dateValue instanceof Date) {
            return dateValue.toLocaleDateString();
        }

        // Tentar converter para Date
        return new Date(dateValue).toLocaleDateString();
    } catch (error) {
        console.error("Erro ao formatar data:", error);
        return "-";
    }
};

const HistoricoCondutaForm = ({ formData, updateFormData, doctorId, patientId, onFileUpload }) => {
    const [showHealthPlanForm, setShowHealthPlanForm] = useState(false);
    const [currentPlanIndex, setCurrentPlanIndex] = useState(-1);

    // Mudanças de texto
    const handleChange = (e) => {
        const { name, value } = e.target;
        updateFormData({ [name]: value });
    };

    // Handlers para planos de saúde
    const getHealthPlans = () => {
        if (Array.isArray(formData.healthPlans) && formData.healthPlans.length > 0) {
            return formData.healthPlans;
        }
        return formData.healthPlans || [];
    };

    const handleAddHealthPlan = () => {
        setCurrentPlanIndex(-1); // -1 means new plan
        setShowHealthPlanForm(true);
    };

    const handleEditHealthPlan = (index) => {
        setCurrentPlanIndex(index);
        setShowHealthPlanForm(true);
    };

    const handleDeleteHealthPlan = (index) => {
        const healthPlans = [...getHealthPlans()];
        healthPlans.splice(index, 1);

        updateFormData({
            healthPlans: healthPlans,
            // Keep backward compatibility
            healthPlan: healthPlans[0] || {}
        });
    };

    const handleSaveHealthPlan = (updatedPlan) => {
        // Salvar o plano enviado pelo diálogo
        const healthPlans = [...getHealthPlans()];

        if (currentPlanIndex >= 0 && currentPlanIndex < healthPlans.length) {
            // Update existing plan
            healthPlans[currentPlanIndex] = updatedPlan;
        } else {
            // Add new plan
            healthPlans.push(updatedPlan);
        }

        updateFormData({
            healthPlans: healthPlans,
            healthPlan: healthPlans[0] || {}
        });

        setShowHealthPlanForm(false);
    };

    const handleCancelHealthPlan = () => {
        setShowHealthPlanForm(false);
    };

    const healthPlans = getHealthPlans();

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

                {/* Planos de Saúde (Substituindo a seção de Anexo) */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <SectionTitle>Planos de Saúde</SectionTitle>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleAddHealthPlan}
                            sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontFamily: 'Gellix, sans-serif',
                                fontSize: '13px',
                                borderColor: themeColors.primary,
                                color: themeColors.primary,
                                '&:hover': {
                                    backgroundColor: themeColors.primaryLight,
                                    borderColor: themeColors.primary,
                                },
                                height: '36px',
                            }}
                        >
                            Adicionar Plano
                        </Button>
                    </Box>

                    {healthPlans.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {healthPlans.map((plan, index) => {
                                const colorScheme = getHealthPlanColor(plan.name, index);

                                return (
                                    <Paper
                                        key={plan.id || index}
                                        elevation={0}
                                        sx={{
                                            padding: '16px',
                                            borderRadius: '12px',
                                            backgroundColor: '#fff',
                                            border: `1px solid ${colorScheme.border}`,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '6px',
                                                height: '100%',
                                                backgroundColor: colorScheme.color,
                                            }
                                        }}
                                    >
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            display: 'flex',
                                            gap: 0.5
                                        }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEditHealthPlan(index)}
                                                sx={{
                                                    backgroundColor: themeColors.primaryLight,
                                                    color: themeColors.primary,
                                                    width: 28,
                                                    height: 28,
                                                    '&:hover': {
                                                        backgroundColor: `${themeColors.primaryLight}dd`,
                                                    }
                                                }}
                                            >
                                                <EditIcon fontSize="small" sx={{ fontSize: 16 }} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteHealthPlan(index)}
                                                sx={{
                                                    backgroundColor: '#FFE8E5',
                                                    color: themeColors.error,
                                                    width: 28,
                                                    height: 28,
                                                    '&:hover': {
                                                        backgroundColor: '#FFD6D6',
                                                    }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ pl: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Typography
                                                    sx={{
                                                        fontFamily: 'Gellix, sans-serif',
                                                        fontSize: '16px',
                                                        fontWeight: 600,
                                                        color: colorScheme.color,
                                                        mr: 1,
                                                    }}
                                                >
                                                    {plan.name || "Plano sem nome"}
                                                </Typography>
                                                <Chip
                                                    label={plan.type || "Tipo não especificado"}
                                                    size="small"
                                                    sx={{
                                                        height: 24,
                                                        borderRadius: 12,
                                                        backgroundColor: colorScheme.bg,
                                                        color: colorScheme.color,
                                                        fontSize: '11px',
                                                        fontFamily: 'Gellix, sans-serif',
                                                    }}
                                                />
                                            </Box>

                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography
                                                        sx={{
                                                            fontFamily: 'Gellix, sans-serif',
                                                            fontSize: '12px',
                                                            color: themeColors.textTertiary,
                                                        }}
                                                    >
                                                        Número do plano
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            fontFamily: 'Gellix, sans-serif',
                                                            fontSize: '14px',
                                                            fontWeight: 500,
                                                            color: themeColors.textPrimary,
                                                        }}
                                                    >
                                                        {plan.number || "-"}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography
                                                        sx={{
                                                            fontFamily: 'Gellix, sans-serif',
                                                            fontSize: '12px',
                                                            color: themeColors.textTertiary,
                                                        }}
                                                    >
                                                        Validade
                                                    </Typography>
                                                    <Typography
                                                        sx={{
                                                            fontFamily: 'Gellix, sans-serif',
                                                            fontSize: '14px',
                                                            fontWeight: 500,
                                                            color: themeColors.textPrimary,
                                                        }}
                                                    >
                                                        {plan.validUntil ? formatDate(plan.validUntil) : "-"}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Paper>
                                );
                            })}
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                backgroundColor: '#fff',
                                borderRadius: '10px',
                                border: `1px dashed ${themeColors.borderColor}`,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontFamily: 'Gellix, sans-serif',
                                    fontSize: '14px',
                                    color: themeColors.textSecondary,
                                    textAlign: 'center',
                                    mb: 2
                                }}
                            >
                                Nenhum plano de saúde cadastrado
                            </Typography>
                            <Button
                                variant="text"
                                startIcon={<AddIcon />}
                                onClick={handleAddHealthPlan}
                                sx={{
                                    textTransform: 'none',
                                    fontFamily: 'Gellix, sans-serif',
                                    color: themeColors.primary,
                                }}
                            >
                                Adicionar plano de saúde
                            </Button>
                        </Box>
                    )}
                </Grid>
            </Grid>

            {/* Diálogo de formulário de plano de saúde */}
            {showHealthPlanForm && (
                <HealthPlanFormDialog
                    open={showHealthPlanForm}
                    onClose={handleCancelHealthPlan}
                    onSave={handleSaveHealthPlan}
                    plan={currentPlanIndex >= 0 ? getHealthPlans()[currentPlanIndex] : {id: `plan-${Date.now()}`}}
                />
            )}
        </Box>
    );
};

export default HistoricoCondutaForm;