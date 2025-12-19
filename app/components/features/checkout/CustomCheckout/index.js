/**
 * CustomCheckout - Main checkout component and subcomponents
 *
 * This module exports the checkout components for subscription management.
 *
 * Components:
 * - CustomCheckout: Main checkout wrapper with Stripe Elements
 * - CheckoutForm: Form handling payment processing
 * - PlanCard: Individual plan display card
 * - PaymentMethodSelector: Card/Boleto selection
 *
 * Utils:
 * - checkout.utils.js: Validation and formatting functions
 * - checkout.constants.js: Plans data and configuration
 */

// Re-export from original file for backward compatibility
// Once migration is complete, this will export from the new modular structure
export { default } from '../../../templates/customCheckout';

// Export subcomponents
export { default as PlanCard } from './PlanCard';
export { default as PaymentMethodSelector } from './PaymentMethodSelector';

// Export utilities
export * from './checkout.utils';
export { plansData, CARD_ELEMENT_OPTIONS, initialFormData } from './checkout.constants';
