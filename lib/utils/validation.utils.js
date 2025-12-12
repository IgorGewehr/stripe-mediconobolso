/**
 * Validation Utilities
 *
 * Functions for form validation and data verification.
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate Brazilian CPF
 * @param {string} cpf - CPF to validate (with or without formatting)
 * @returns {boolean} True if valid CPF
 */
export function isValidCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') return false;

  // Remove formatting
  const cleanCPF = cpf.replace(/\D/g, '');

  // Must have 11 digits
  if (cleanCPF.length !== 11) return false;

  // Check for known invalid patterns
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

/**
 * Validate Brazilian phone number
 * @param {string} phone - Phone to validate
 * @returns {boolean} True if valid phone format
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleanPhone = phone.replace(/\D/g, '');
  // Brazilian phones: 10 digits (fixed) or 11 digits (mobile)
  return cleanPhone.length === 10 || cleanPhone.length === 11;
}

/**
 * Validate required field
 * @param {any} value - Value to check
 * @returns {boolean} True if value is not empty
 */
export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate minimum length
 * @param {string} value - String to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean} True if valid
 */
export function hasMinLength(value, minLength) {
  if (!value || typeof value !== 'string') return false;
  return value.length >= minLength;
}

/**
 * Validate maximum length
 * @param {string} value - String to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if valid
 */
export function hasMaxLength(value, maxLength) {
  if (!value || typeof value !== 'string') return true;
  return value.length <= maxLength;
}

/**
 * Validate date is in the past
 * @param {Date|string} date - Date to validate
 * @returns {boolean} True if date is in the past
 */
export function isPastDate(date) {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.getTime() < Date.now();
}

/**
 * Validate date is in the future
 * @param {Date|string} date - Date to validate
 * @returns {boolean} True if date is in the future
 */
export function isFutureDate(date) {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.getTime() > Date.now();
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL format
 */
export function isValidURL(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
export function validatePassword(password) {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Senha obrigatória'] };
  }

  if (password.length < 6) {
    errors.push('Senha deve ter pelo menos 6 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve ter pelo menos uma letra maiúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve ter pelo menos uma letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve ter pelo menos um número');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate blood type
 * @param {string} bloodType - Blood type to validate
 * @returns {boolean} True if valid blood type
 */
export function isValidBloodType(bloodType) {
  const validTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  return validTypes.includes(bloodType);
}

/**
 * Sanitize string input (remove dangerous characters)
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, ''); // Remove potentially dangerous chars
}

/**
 * Validate form data against schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @returns {{ valid: boolean, errors: Object }} Validation result
 */
export function validateForm(data, schema) {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    if (rules.required && !isRequired(value)) {
      errors[field] = `${rules.label || field} é obrigatório`;
      continue;
    }

    if (value && rules.email && !isValidEmail(value)) {
      errors[field] = 'Email inválido';
    }

    if (value && rules.cpf && !isValidCPF(value)) {
      errors[field] = 'CPF inválido';
    }

    if (value && rules.phone && !isValidPhone(value)) {
      errors[field] = 'Telefone inválido';
    }

    if (value && rules.minLength && !hasMinLength(value, rules.minLength)) {
      errors[field] = `Mínimo de ${rules.minLength} caracteres`;
    }

    if (value && rules.maxLength && !hasMaxLength(value, rules.maxLength)) {
      errors[field] = `Máximo de ${rules.maxLength} caracteres`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
