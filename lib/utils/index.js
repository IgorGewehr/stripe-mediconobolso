/**
 * Utilities Index
 *
 * Re-exports all utility functions for convenient imports.
 */

// Firebase utilities
export {
  formatDateTimeToString,
  parseStringToDate,
  processConsultationDates,
  formatFileSize as formatFileSizeFB,
  lastUpdateTimestamps
} from './firebase.utils';

// Date utilities
export {
  formatDateBR,
  formatDateTimeBR,
  formatDateISO,
  parseISODate,
  getRelativeTime,
  isToday,
  isPast,
  isFuture,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
  calculateAge,
  parseBrazilianDate,
  parseAnyDate,
  getTimeDiff,
  matchesAgeRange
} from './date.utils';

// Validation utilities
export {
  isValidEmail,
  isValidCPF,
  isValidPhone,
  isRequired,
  hasMinLength,
  hasMaxLength,
  isPastDate,
  isFutureDate,
  isValidURL,
  validatePassword,
  isValidBloodType,
  sanitizeString,
  validateForm
} from './validation.utils';

// Format utilities
export {
  formatCurrency,
  formatNumber,
  formatCPF,
  formatPhone,
  formatCEP,
  formatFileSize,
  formatPercent,
  truncate,
  capitalize,
  capitalizeWords,
  formatName,
  getInitials,
  formatBloodPressure,
  formatWeight,
  formatHeight,
  formatBMI,
  removeAccents,
  slugify
} from './format.utils';

// Firebase helpers
export {
  mapSnapshotToDocs,
  getServerTimestamp,
  createTimestamps,
  updateTimestamp,
  validateRequired,
  buildPath,
  userCollectionPath,
  handleListError,
  handleGetError
} from './firebaseHelpers';

// Constants
export * from './constants';
