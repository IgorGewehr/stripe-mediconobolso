/**
 * Firebase Utilities
 *
 * Shared utility functions for Firebase services
 */

/**
 * Converts any date type to string YYYY-MM-DD
 */
export function formatDateTimeToString(dateValue) {
    if (!dateValue) return null;
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
    }
    const date = new Date(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Converts string YYYY-MM-DD to Date object
 */
export function parseStringToDate(stringValue) {
    if (stringValue == null) return null;
    if (stringValue instanceof Date) return stringValue;
    if (typeof stringValue.toDate === 'function') {
        return stringValue.toDate();
    }
    if (typeof stringValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
        const [year, month, day] = stringValue.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    const parsed = new Date(stringValue);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Processes consultation converting dates
 */
export function processConsultationDates(consultation) {
    if (!consultation) return consultation;
    const processed = {...consultation};
    if (processed.consultationDate) {
        processed.consultationDate = parseStringToDate(processed.consultationDate);
    }
    return processed;
}

/**
 * Formats file size for display
 */
export function formatFileSize(sizeInBytes) {
    if (sizeInBytes < 1024) return sizeInBytes + ' bytes';
    if (sizeInBytes < 1024 * 1024) return (sizeInBytes / 1024).toFixed(1) + 'KB';
    if (sizeInBytes < 1024 * 1024 * 1024) return (sizeInBytes / (1024 * 1024)).toFixed(1) + 'MB';
    return (sizeInBytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
}

/**
 * Cache cleanup timestamps
 */
export const lastUpdateTimestamps = {};

// Cache cleanup - runs every 3 hours
if (typeof window !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        Object.keys(lastUpdateTimestamps).forEach(key => {
            const age = now - lastUpdateTimestamps[key];
            if (age > 24 * 60 * 60 * 1000) { // 24 hours
                delete lastUpdateTimestamps[key];
            }
        });
    }, 3 * 60 * 60 * 1000);
}
