/**
 * Format Utilities
 *
 * Functions for formatting numbers, currency, strings, etc.
 */

/**
 * Format number as Brazilian currency (BRL)
 * @param {number} value - Number to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Format number with Brazilian locale
 * @param {number} value - Number to format
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = 2) {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format CPF with mask
 * @param {string} cpf - CPF digits
 * @returns {string} Formatted CPF (000.000.000-00)
 */
export function formatCPF(cpf) {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Format phone with mask
 * @param {string} phone - Phone digits
 * @returns {string} Formatted phone ((00) 00000-0000 or (00) 0000-0000)
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

/**
 * Format CEP with mask
 * @param {string} cep - CEP digits
 * @returns {string} Formatted CEP (00000-000)
 */
export function formatCEP(cep) {
  if (!cep) return '';
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return cep;
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || isNaN(bytes)) return '0 bytes';
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

/**
 * Format percentage
 * @param {number} value - Decimal value (0.5 = 50%)
 * @param {number} [decimals=0] - Decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, decimals = 0) {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength) {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalize each word in string
 * @param {string} str - String to capitalize
 * @returns {string} String with each word capitalized
 */
export function capitalizeWords(str) {
  if (!str || typeof str !== 'string') return '';
  return str.split(' ').map(word => capitalize(word)).join(' ');
}

/**
 * Format name (capitalize first and last name)
 * @param {string} name - Full name
 * @returns {string} Formatted name
 */
export function formatName(name) {
  if (!name || typeof name !== 'string') return '';
  const words = name.trim().split(/\s+/);
  return words.map((word, index) => {
    // Don't capitalize small prepositions
    const lowercaseWords = ['de', 'da', 'do', 'das', 'dos', 'e'];
    if (index > 0 && lowercaseWords.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    return capitalize(word);
  }).join(' ');
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @param {number} [maxLength=2] - Maximum initials
 * @returns {string} Initials
 */
export function getInitials(name, maxLength = 2) {
  if (!name || typeof name !== 'string') return '';
  const words = name.trim().split(/\s+/);
  const initials = words
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase());
  return initials.slice(0, maxLength).join('');
}

/**
 * Format blood pressure
 * @param {number} systolic - Systolic pressure
 * @param {number} diastolic - Diastolic pressure
 * @returns {string} Formatted blood pressure (120/80)
 */
export function formatBloodPressure(systolic, diastolic) {
  if (!systolic || !diastolic) return '';
  return `${Math.round(systolic)}/${Math.round(diastolic)}`;
}

/**
 * Format weight with unit
 * @param {number} weight - Weight in kg
 * @returns {string} Formatted weight (70.5 kg)
 */
export function formatWeight(weight) {
  if (typeof weight !== 'number' || isNaN(weight)) return '';
  return `${weight.toFixed(1)} kg`;
}

/**
 * Format height with unit
 * @param {number} height - Height in cm
 * @returns {string} Formatted height (1.70 m)
 */
export function formatHeight(height) {
  if (typeof height !== 'number' || isNaN(height)) return '';
  return `${(height / 100).toFixed(2)} m`;
}

/**
 * Calculate and format BMI
 * @param {number} weightKg - Weight in kg
 * @param {number} heightCm - Height in cm
 * @returns {string} Formatted BMI with category
 */
export function formatBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return '';
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  let category = '';
  if (bmi < 18.5) category = 'Abaixo do peso';
  else if (bmi < 25) category = 'Normal';
  else if (bmi < 30) category = 'Sobrepeso';
  else category = 'Obesidade';

  return `${bmi.toFixed(1)} (${category})`;
}

/**
 * Remove accents from string
 * @param {string} str - String with accents
 * @returns {string} String without accents
 */
export function removeAccents(str) {
  if (!str || typeof str !== 'string') return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Create slug from string
 * @param {string} str - String to convert
 * @returns {string} URL-friendly slug
 */
export function slugify(str) {
  if (!str || typeof str !== 'string') return '';
  return removeAccents(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
