/**
 * Financial Components - Barrel Export
 *
 * Components for the financial management system:
 * - Dashboard with KPIs
 * - Contas a Receber (Accounts Receivable)
 * - Contas a Pagar (Accounts Payable)
 * - Cash Flow Analysis
 * - Efficiency Metrics
 * - Fornecedores (Suppliers)
 * - Contas Bancarias (Bank Accounts)
 * - Sugestoes Financeiras (Financial Suggestions)
 * - Repasses (Doctor Payouts)
 */

// Dashboard
export { default as FinancialDashboard } from './FinancialDashboard';

// Contas a Receber
export { default as ContasReceberList } from './ContasReceberList';
export { default as ContaReceberForm } from './ContaReceberForm';
export { default as RecebimentoDialog } from './RecebimentoDialog';

// Contas a Pagar
export { default as ContasPagarList } from './ContasPagarList';
export { default as ContaPagarForm } from './ContaPagarForm';
export { default as PagamentoDialog } from './PagamentoDialog';

// Cash Flow & Efficiency
export { default as CashFlowView } from './CashFlowView';
export { default as EfficiencyMetrics } from './EfficiencyMetrics';

// Fornecedores
export { default as FornecedoresList } from './FornecedoresList';
export { default as FornecedorForm } from './FornecedorForm';

// Contas Bancarias
export { default as ContasBancariasList } from './ContasBancariasList';
export { default as ContaBancariaForm } from './ContaBancariaForm';
export { default as TransferenciaDialog } from './TransferenciaDialog';

// Sugestoes Financeiras
export { default as SugestoesFinanceirasList } from './SugestoesFinanceirasList';

// Repasses
export { default as RepassesList } from './RepassesList';

// Convenios
export { default as ConveniosList } from './ConveniosList';
export { default as ConvenioForm } from './ConvenioForm';
