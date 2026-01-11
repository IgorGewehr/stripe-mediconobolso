/**
 * Prescriptions Feature Components
 *
 * Componentes para receitas digitais com:
 * - Assinatura digital ICP-Brasil
 * - Validacao de medicamentos controlados
 * - QR Code para validacao em farmacias
 * - Conformidade com CFM, ANVISA e normas brasileiras
 *
 * Novos componentes minimalistas (2024):
 * - PrescriptionDialog: Dialog simplificado para criacao de receitas
 * - MedicationCard: Card de medicamento com design moderno
 * - MedicationQuickSelect: Selecao rapida de favoritos/recentes
 */

// Dialog principal (NOVO - substituicao minimalista)
export { default as PrescriptionDialog } from './PrescriptionDialog';

// Componentes de medicamentos (NOVO)
export { MedicationCard, QuickSelectCard, MedicationPill } from './MedicationCard';
export { default as MedicationSearchInput } from './MedicationSearchInput';
export { default as MedicationQuickSelect } from './MedicationQuickSelect';

// Widgets para sidebar (NOVO)
export { default as FavoriteMedicationsWidget } from './widgets/FavoriteMedicationsWidget';
export { default as RecentMedicationsWidget } from './widgets/RecentMedicationsWidget';

// Form avancado (mantido para compliance e assinatura digital)
export { default as DigitalPrescriptionForm } from './DigitalPrescriptionForm';
