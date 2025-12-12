/**
 * Date Utilities
 *
 * Functions for date formatting, parsing, and manipulation.
 */

/**
 * Format a date to Brazilian locale string
 * @param {Date|string|null} date - Date to format
 * @returns {string} Formatted date string or empty string
 */
export function formatDateBR(date) {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('pt-BR');
}

/**
 * Format a date and time to Brazilian locale string
 * @param {Date|string|null} date - Date to format
 * @returns {string} Formatted datetime string or empty string
 */
export function formatDateTimeBR(date) {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleString('pt-BR');
}

/**
 * Format a date to ISO format (YYYY-MM-DD)
 * @param {Date|string|null} date - Date to format
 * @returns {string|null} ISO date string or null
 */
export function formatDateISO(date) {
  if (!date) return null;
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return null;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse ISO date string to Date object
 * @param {string} isoString - ISO date string (YYYY-MM-DD)
 * @returns {Date|null} Date object or null
 */
export function parseISODate(isoString) {
  if (!isoString) return null;
  if (typeof isoString !== 'string') return null;
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - Date to compare
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
  if (!date) return 'N/A';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return 'N/A';

  const now = Date.now();
  const diffMs = now - dateObj.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}m`;
  return `${Math.floor(diffDays / 365)}a`;
}

/**
 * Check if a date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
export function isToday(date) {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export function isPast(date) {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.getTime() < Date.now();
}

/**
 * Check if a date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the future
 */
export function isFuture(date) {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.getTime() > Date.now();
}

/**
 * Get start of day for a date
 * @param {Date|string} date - Date input
 * @returns {Date} Date at start of day (00:00:00)
 */
export function startOfDay(date) {
  const dateObj = date instanceof Date ? new Date(date) : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
}

/**
 * Get end of day for a date
 * @param {Date|string} date - Date input
 * @returns {Date} Date at end of day (23:59:59)
 */
export function endOfDay(date) {
  const dateObj = date instanceof Date ? new Date(date) : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
}

/**
 * Get first day of month
 * @param {Date|string} date - Date input
 * @returns {Date} First day of the month
 */
export function startOfMonth(date) {
  const dateObj = date instanceof Date ? new Date(date) : new Date(date);
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
}

/**
 * Get last day of month
 * @param {Date|string} date - Date input
 * @returns {Date} Last day of the month
 */
export function endOfMonth(date) {
  const dateObj = date instanceof Date ? new Date(date) : new Date(date);
  return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
}

/**
 * Add days to a date
 * @param {Date|string} date - Date input
 * @param {number} days - Number of days to add
 * @returns {Date} New date with days added
 */
export function addDays(date, days) {
  const dateObj = date instanceof Date ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
}

/**
 * Calculate age from birth date
 * @param {Date|string} birthDate - Birth date
 * @returns {number} Age in years
 */
export function calculateAge(birthDate) {
  if (!birthDate) return 0;
  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
