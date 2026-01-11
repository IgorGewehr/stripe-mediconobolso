'use client';

/**
 * PrescriptionDialog - Dialog minimalista para criacao de receitas
 *
 * Design consistente com DashboardTemplate/PatientTemplate:
 * - Sombras sutis ao inves de bordas
 * - Transicoes suaves
 * - Progressive disclosure
 * - Mobile-first
 */

import React, { useState, useCallback, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import {
    X,
    ArrowLeft,
    Plus,
    Pill,
    FileText,
    Save,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Clock,
    Star,
    Loader2,
    Check,
} from 'lucide-react';
import { Dialog, DialogContent, Slide, Snackbar, Alert } from '@mui/material';
import { format, addDays, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { prescriptionsService, patientsService } from '@/lib/services/api';
import { useAuth } from '../../providers/authProvider';
import { useMedicationFavorites } from '../../hooks/useMedicationFavorites';

import MedicationSearchInput from './MedicationSearchInput';
import MedicationQuickSelect from './MedicationQuickSelect';
import { MedicationCard } from './MedicationCard';

// Transicao do dialog
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Tipos de receita com validade automatica
const PRESCRIPTION_TYPES = {
    comum: { label: 'Receita Simples', validity: 180, color: 'slate' },
    controlada: { label: 'Controlada (C1)', validity: 30, color: 'indigo' },
    especial: { label: 'Especial', validity: 60, color: 'amber' },
    antimicrobiano: { label: 'Antimicrobiano', validity: 10, color: 'purple' },
};

/**
 * PrescriptionDialog - Componente principal
 */
export const PrescriptionDialog = memo(({
    open,
    onClose,
    patientId: initialPatientId,
    patientName: initialPatientName,
    onSuccess,
    editData,
}) => {
    const { userContext } = useAuth();
    const { favorites, recentMedications, isLoading: loadingMeds, toggleFavorite, trackUsage } =
        useMedicationFavorites();

    // Estados principais
    const [patientId, setPatientId] = useState(initialPatientId || '');
    const [patientName, setPatientName] = useState(initialPatientName || '');
    const [prescriptionType, setPrescriptionType] = useState('comum');
    const [medications, setMedications] = useState([]);
    const [notes, setNotes] = useState('');

    // Estados de UI
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isAddingMed, setIsAddingMed] = useState(false);
    const [editingMedIndex, setEditingMedIndex] = useState(null);
    const [tempMedication, setTempMedication] = useState(getEmptyMedication());

    // Estados de processo
    const [isSaving, setIsSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Calcular validade baseada no tipo
    const validityDays = PRESCRIPTION_TYPES[prescriptionType]?.validity || 180;
    const expiryDate = format(addDays(new Date(), validityDays), 'dd/MM/yyyy');

    // Reset ao abrir/fechar
    useEffect(() => {
        if (open) {
            setPatientId(initialPatientId || '');
            setPatientName(initialPatientName || '');
            setMedications(editData?.medications || []);
            setNotes(editData?.notes || '');
            setPrescriptionType(editData?.prescriptionType || 'comum');
            setIsAddingMed(false);
            setEditingMedIndex(null);
        }
    }, [open, initialPatientId, initialPatientName, editData]);

    // Handlers de medicamento
    const handleQuickAddMedication = useCallback((medication) => {
        const newMed = {
            ...medication,
            id: `med_${Date.now()}`,
            dosage: medication.defaultDosage || medication.dosage || '',
            quantity: medication.defaultQuantity || medication.quantity || 1,
            duration: medication.duration || '',
            instructions: medication.instructions || '',
        };

        setMedications(prev => [...prev, newMed]);
        trackUsage(medication);

        setSnackbar({
            open: true,
            message: `${medication.name || medication.drugName} adicionado`,
            severity: 'success',
        });
    }, [trackUsage]);

    const handleSearchSelect = useCallback((medication) => {
        setTempMedication({
            ...getEmptyMedication(),
            name: medication.name || medication.drugName,
            drugName: medication.name || medication.drugName,
            concentration: medication.concentration || '',
            controlledType: medication.controlledType || 'none',
        });
        setIsAddingMed(true);
    }, []);

    const handleAddMedication = useCallback(() => {
        if (!tempMedication.name?.trim()) {
            setSnackbar({
                open: true,
                message: 'Digite o nome do medicamento',
                severity: 'error',
            });
            return;
        }

        const newMed = {
            ...tempMedication,
            id: `med_${Date.now()}`,
        };

        if (editingMedIndex !== null) {
            setMedications(prev => {
                const updated = [...prev];
                updated[editingMedIndex] = newMed;
                return updated;
            });
            setEditingMedIndex(null);
        } else {
            setMedications(prev => [...prev, newMed]);
        }

        setTempMedication(getEmptyMedication());
        setIsAddingMed(false);
        trackUsage(newMed);
    }, [tempMedication, editingMedIndex, trackUsage]);

    const handleEditMedication = useCallback((medication) => {
        const index = medications.findIndex(m => m.id === medication.id);
        if (index !== -1) {
            setTempMedication(medication);
            setEditingMedIndex(index);
            setIsAddingMed(true);
        }
    }, [medications]);

    const handleRemoveMedication = useCallback((medication) => {
        setMedications(prev => prev.filter(m => m.id !== medication.id));
    }, []);

    const handleToggleFavorite = useCallback((medication) => {
        toggleFavorite(medication);
    }, [toggleFavorite]);

    // Salvar receita
    const handleSave = useCallback(async () => {
        if (!patientId) {
            setSnackbar({
                open: true,
                message: 'Selecione um paciente',
                severity: 'error',
            });
            return;
        }

        if (medications.length === 0) {
            setSnackbar({
                open: true,
                message: 'Adicione pelo menos um medicamento',
                severity: 'error',
            });
            return;
        }

        setIsSaving(true);

        try {
            const prescriptionData = {
                prescriptionType,
                notes,
                medications: medications.map(med => ({
                    medicationName: med.name || med.drugName,
                    dosage: med.dosage,
                    quantity: med.quantity,
                    duration: med.duration,
                    instructions: med.instructions,
                    concentration: med.concentration,
                    controlledType: med.controlledType,
                })),
            };

            if (editData?.id) {
                await prescriptionsService.update(editData.id, prescriptionData);
            } else {
                await prescriptionsService.create(patientId, prescriptionData);
            }

            setSnackbar({
                open: true,
                message: editData ? 'Receita atualizada!' : 'Receita criada com sucesso!',
                severity: 'success',
            });

            onSuccess?.();
            setTimeout(() => onClose(), 1000);
        } catch (error) {
            console.error('Erro ao salvar receita:', error);
            setSnackbar({
                open: true,
                message: error.userMessage || 'Erro ao salvar receita',
                severity: 'error',
            });
        } finally {
            setIsSaving(false);
        }
    }, [patientId, medications, prescriptionType, notes, editData, onSuccess, onClose]);

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                TransitionComponent={Transition}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        maxHeight: '90vh',
                        background: 'linear-gradient(to bottom, #f8fafc, #ffffff)',
                        boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
                    },
                }}
            >
                <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-100">
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                                <div>
                                    <h1 className="text-lg font-semibold text-slate-800">
                                        {editData ? 'Editar Receita' : 'Nova Receita'}
                                    </h1>
                                    {patientName && (
                                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                                            <FileText className="w-3.5 h-3.5" />
                                            {patientName}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving || medications.length === 0}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm",
                                    "transition-all duration-200",
                                    medications.length > 0
                                        ? "bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow-md"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                )}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                Salvar
                            </button>
                        </div>
                    </header>

                    {/* Conteudo principal */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                            {/* Tipo de receita */}
                            <section>
                                <label className="block text-sm font-medium text-slate-600 mb-3">
                                    Tipo de Receita
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {Object.entries(PRESCRIPTION_TYPES).map(([key, config]) => (
                                        <button
                                            key={key}
                                            onClick={() => setPrescriptionType(key)}
                                            className={cn(
                                                "px-4 py-3 rounded-xl text-sm font-medium",
                                                "transition-all duration-200",
                                                prescriptionType === key
                                                    ? `bg-${config.color}-100 text-${config.color}-700 ring-2 ring-${config.color}-200`
                                                    : "bg-white text-slate-600 hover:bg-slate-50 shadow-sm"
                                            )}
                                        >
                                            {config.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    Validade: {validityDays} dias (expira em {expiryDate})
                                </p>
                            </section>

                            {/* Quick Select */}
                            {!isAddingMed && (
                                <section className="bg-white rounded-2xl shadow-sm p-5">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-primary" />
                                        Adicao Rapida
                                    </h3>

                                    <MedicationQuickSelect
                                        favorites={favorites}
                                        recentMedications={recentMedications}
                                        onSelect={handleQuickAddMedication}
                                        onToggleFavorite={handleToggleFavorite}
                                        isLoading={loadingMeds}
                                    />

                                    {/* Busca */}
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <MedicationSearchInput
                                            onSelect={handleSearchSelect}
                                            placeholder="Buscar outro medicamento..."
                                        />
                                    </div>
                                </section>
                            )}

                            {/* Formulario de medicamento */}
                            {isAddingMed && (
                                <section className="bg-white rounded-2xl shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-slate-700">
                                            {editingMedIndex !== null ? 'Editar Medicamento' : 'Novo Medicamento'}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setIsAddingMed(false);
                                                setEditingMedIndex(null);
                                                setTempMedication(getEmptyMedication());
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                        >
                                            <X className="w-4 h-4 text-slate-500" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Nome */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                                Nome do Medicamento *
                                            </label>
                                            <input
                                                type="text"
                                                value={tempMedication.name || ''}
                                                onChange={(e) => setTempMedication(prev => ({
                                                    ...prev,
                                                    name: e.target.value,
                                                    drugName: e.target.value,
                                                }))}
                                                className={cn(
                                                    "w-full h-11 px-4 rounded-xl",
                                                    "bg-slate-50 border border-slate-200",
                                                    "text-slate-800 placeholder:text-slate-400",
                                                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                )}
                                                placeholder="Ex: Dipirona 500mg"
                                            />
                                        </div>

                                        {/* Campos essenciais */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                                    Posologia
                                                </label>
                                                <input
                                                    type="text"
                                                    value={tempMedication.dosage || ''}
                                                    onChange={(e) => setTempMedication(prev => ({
                                                        ...prev,
                                                        dosage: e.target.value,
                                                    }))}
                                                    className={cn(
                                                        "w-full h-11 px-4 rounded-xl",
                                                        "bg-slate-50 border border-slate-200",
                                                        "text-slate-800 placeholder:text-slate-400",
                                                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    )}
                                                    placeholder="Ex: 1 comp. 8/8h"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                                    Quantidade
                                                </label>
                                                <input
                                                    type="number"
                                                    value={tempMedication.quantity || ''}
                                                    onChange={(e) => setTempMedication(prev => ({
                                                        ...prev,
                                                        quantity: parseInt(e.target.value) || '',
                                                    }))}
                                                    className={cn(
                                                        "w-full h-11 px-4 rounded-xl",
                                                        "bg-slate-50 border border-slate-200",
                                                        "text-slate-800 placeholder:text-slate-400",
                                                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    )}
                                                    placeholder="Ex: 10"
                                                    min="1"
                                                />
                                            </div>
                                        </div>

                                        {/* Campos avancados (expandiveis) */}
                                        <button
                                            onClick={() => setShowAdvanced(!showAdvanced)}
                                            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                                        >
                                            {showAdvanced ? (
                                                <>
                                                    <ChevronUp className="w-4 h-4" />
                                                    Menos opcoes
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-4 h-4" />
                                                    Mais opcoes
                                                </>
                                            )}
                                        </button>

                                        {showAdvanced && (
                                            <div className="space-y-3 pt-2">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                                            Concentracao
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={tempMedication.concentration || ''}
                                                            onChange={(e) => setTempMedication(prev => ({
                                                                ...prev,
                                                                concentration: e.target.value,
                                                            }))}
                                                            className={cn(
                                                                "w-full h-11 px-4 rounded-xl",
                                                                "bg-slate-50 border border-slate-200",
                                                                "text-slate-800 placeholder:text-slate-400",
                                                                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                            )}
                                                            placeholder="Ex: 500mg"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                                            Duracao
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={tempMedication.duration || ''}
                                                            onChange={(e) => setTempMedication(prev => ({
                                                                ...prev,
                                                                duration: e.target.value,
                                                            }))}
                                                            className={cn(
                                                                "w-full h-11 px-4 rounded-xl",
                                                                "bg-slate-50 border border-slate-200",
                                                                "text-slate-800 placeholder:text-slate-400",
                                                                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                            )}
                                                            placeholder="Ex: 7 dias"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                                        Instrucoes adicionais
                                                    </label>
                                                    <textarea
                                                        value={tempMedication.instructions || ''}
                                                        onChange={(e) => setTempMedication(prev => ({
                                                            ...prev,
                                                            instructions: e.target.value,
                                                        }))}
                                                        className={cn(
                                                            "w-full h-20 px-4 py-3 rounded-xl resize-none",
                                                            "bg-slate-50 border border-slate-200",
                                                            "text-slate-800 placeholder:text-slate-400",
                                                            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                        )}
                                                        placeholder="Ex: Tomar apos as refeicoes"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Botoes */}
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => {
                                                    setIsAddingMed(false);
                                                    setEditingMedIndex(null);
                                                    setTempMedication(getEmptyMedication());
                                                }}
                                                className={cn(
                                                    "flex-1 h-11 rounded-xl font-medium text-sm",
                                                    "bg-slate-100 text-slate-600 hover:bg-slate-200",
                                                    "transition-colors duration-200"
                                                )}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleAddMedication}
                                                className={cn(
                                                    "flex-1 h-11 rounded-xl font-medium text-sm",
                                                    "bg-primary text-white hover:bg-primary/90",
                                                    "transition-colors duration-200 shadow-sm hover:shadow-md"
                                                )}
                                            >
                                                {editingMedIndex !== null ? 'Atualizar' : 'Adicionar'}
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Lista de medicamentos */}
                            {medications.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <Pill className="w-4 h-4 text-slate-400" />
                                        Medicamentos ({medications.length})
                                    </h3>

                                    <div className="space-y-3">
                                        {medications.map((med) => (
                                            <MedicationCard
                                                key={med.id}
                                                medication={med}
                                                onEdit={handleEditMedication}
                                                onRemove={handleRemoveMedication}
                                                onToggleFavorite={handleToggleFavorite}
                                            />
                                        ))}
                                    </div>

                                    {!isAddingMed && (
                                        <button
                                            onClick={() => setIsAddingMed(true)}
                                            className={cn(
                                                "w-full mt-3 py-3 rounded-xl",
                                                "border-2 border-dashed border-slate-200",
                                                "text-sm font-medium text-slate-500",
                                                "hover:border-primary hover:text-primary",
                                                "transition-colors duration-200",
                                                "flex items-center justify-center gap-2"
                                            )}
                                        >
                                            <Plus className="w-4 h-4" />
                                            Adicionar outro medicamento
                                        </button>
                                    )}
                                </section>
                            )}

                            {/* Observacoes */}
                            <section>
                                <label className="block text-sm font-medium text-slate-600 mb-2">
                                    Orientacoes Gerais
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className={cn(
                                        "w-full h-24 px-4 py-3 rounded-xl resize-none",
                                        "bg-white border border-slate-200 shadow-sm",
                                        "text-slate-800 placeholder:text-slate-400",
                                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                                        "transition-all duration-200"
                                    )}
                                    placeholder="Orientacoes adicionais para o paciente..."
                                />
                            </section>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    sx={{ borderRadius: '12px' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
});

PrescriptionDialog.displayName = 'PrescriptionDialog';

// Helper: Medicamento vazio
function getEmptyMedication() {
    return {
        name: '',
        drugName: '',
        concentration: '',
        dosage: '',
        quantity: '',
        duration: '',
        instructions: '',
        controlledType: 'none',
    };
}

export default PrescriptionDialog;
