/**
 * Subscriptions Service
 *
 * Serviço para gerenciar assinaturas via doctor-server.
 * O checkout/webhook Stripe continua no Next.js,
 * mas a persistência e verificação de status é feita no backend.
 */

import apiService from './apiService';

/**
 * Tipos de plano disponíveis
 */
export const PlanType = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
};

/**
 * Status da assinatura
 */
export const SubscriptionStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  TRIALING: 'trialing',
  PAST_DUE: 'past_due',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

/**
 * Métodos de pagamento
 */
export const PaymentMethod = {
  CARD: 'card',
  BOLETO: 'boleto',
  PIX: 'pix',
};

const subscriptionsService = {
  /**
   * Obter assinatura atual do usuário
   * @returns {Promise<Object|null>} Dados da assinatura ou null
   */
  async getCurrentSubscription() {
    try {
      const response = await apiService.get('/subscriptions/current');
      return normalizeSubscription(response);
    } catch (error) {
      // 404 significa que não tem assinatura
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Verificar se usuário tem assinatura ativa
   * @returns {Promise<boolean>}
   */
  async hasActiveSubscription() {
    try {
      const subscription = await this.getCurrentSubscription();
      if (!subscription) return false;

      return [
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.TRIALING,
      ].includes(subscription.status);
    } catch (error) {
      console.warn('[SubscriptionsService] Error checking subscription:', error);
      return false;
    }
  },

  /**
   * Criar/registrar assinatura no backend
   * Chamado após o checkout do Stripe ser bem sucedido
   *
   * @param {Object} data - Dados da assinatura
   * @param {string} data.planType - Tipo do plano (monthly, quarterly, annual)
   * @param {string} data.paymentMethod - Método de pagamento (card, boleto)
   * @param {string} data.stripeCustomerId - ID do customer no Stripe
   * @param {string} [data.stripeSubscriptionId] - ID da subscription no Stripe
   * @returns {Promise<Object>} Assinatura criada
   */
  async createSubscription(data) {
    const payload = {
      plan_type: data.planType,
      payment_method: data.paymentMethod || PaymentMethod.CARD,
      stripe_customer_id: data.stripeCustomerId,
    };

    const response = await apiService.post('/subscriptions', payload);
    return normalizeSubscription(response);
  },

  /**
   * Sincronizar dados de assinatura do Stripe para o backend
   * Chamado pelo webhook após processar eventos
   *
   * @param {Object} data - Dados do evento Stripe
   */
  async syncFromStripe(data) {
    const payload = {
      event_type: data.eventType,
      stripe_customer_id: data.stripeCustomerId,
      stripe_subscription_id: data.stripeSubscriptionId,
      payment_status: data.paymentStatus,
      plan_type: data.planType,
      payment_method: data.paymentMethod,
      amount: data.amount,
      current_period_end: data.currentPeriodEnd,
      metadata: data.metadata || {},
    };

    return apiService.post('/subscriptions/sync', payload);
  },

  /**
   * Atualizar plano da assinatura
   * @param {string} subscriptionId - ID da assinatura
   * @param {string} newPlanType - Novo tipo de plano
   * @returns {Promise<Object>} Assinatura atualizada
   */
  async changePlan(subscriptionId, newPlanType) {
    const response = await apiService.put(`/subscriptions/${subscriptionId}/plan`, {
      plan_type: newPlanType,
    });
    return normalizeSubscription(response);
  },

  /**
   * Cancelar assinatura
   * @param {string} subscriptionId - ID da assinatura
   * @param {Object} options - Opções de cancelamento
   * @param {string} [options.reason] - Motivo do cancelamento
   * @param {boolean} [options.atPeriodEnd] - Cancelar no fim do período (default: true)
   * @returns {Promise<Object>} Assinatura cancelada
   */
  async cancelSubscription(subscriptionId, options = {}) {
    const response = await apiService.post(`/subscriptions/${subscriptionId}/cancel`, {
      reason: options.reason,
      at_period_end: options.atPeriodEnd !== false,
    });
    return normalizeSubscription(response);
  },

  /**
   * Listar histórico de pagamentos
   * @param {string} subscriptionId - ID da assinatura
   * @param {number} [limit=50] - Limite de registros
   * @returns {Promise<Array>} Lista de pagamentos
   */
  async listPayments(subscriptionId, limit = 50) {
    const response = await apiService.get(`/subscriptions/${subscriptionId}/payments`, { limit });
    return (response.items || []).map(normalizePayment);
  },

  /**
   * Verificar status de pagamento de boleto
   * @returns {Promise<boolean>} True se tem boleto pendente
   */
  async hasPendingBoleto() {
    try {
      const subscription = await this.getCurrentSubscription();
      return subscription?.awaitingBoletoPayment === true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Obter URL do boleto pendente
   * @returns {Promise<string|null>} URL do boleto ou null
   */
  async getBoletoUrl() {
    try {
      const subscription = await this.getCurrentSubscription();
      return subscription?.boletoUrl || null;
    } catch (error) {
      return null;
    }
  },
};

/**
 * Normaliza dados da assinatura do backend para o frontend
 */
function normalizeSubscription(data) {
  if (!data) return null;

  return {
    id: data.id,
    tenantId: data.tenant_id,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    planType: data.plan_type,
    status: data.status,
    paymentMethod: data.payment_method,
    amount: data.amount,
    currency: data.currency || 'BRL',
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    trialEnd: data.trial_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    cancelledAt: data.cancelled_at,
    cancellationReason: data.cancellation_reason,
    lastPaymentAt: data.last_payment_at,
    lastPaymentStatus: data.last_payment_status,
    paymentIssue: data.payment_issue,
    boletoUrl: data.boleto_url,
    boletoExpiresAt: data.boleto_expires_at,
    awaitingBoletoPayment: data.awaiting_boleto_payment,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Normaliza dados de pagamento do backend para o frontend
 */
function normalizePayment(data) {
  if (!data) return null;

  return {
    id: data.id,
    subscriptionId: data.subscription_id,
    stripeInvoiceId: data.stripe_invoice_id,
    stripePaymentIntentId: data.stripe_payment_intent_id,
    amount: data.amount,
    currency: data.currency || 'BRL',
    status: data.status,
    paymentMethod: data.payment_method,
    paidAt: data.paid_at,
    createdAt: data.created_at,
  };
}

export default subscriptionsService;
