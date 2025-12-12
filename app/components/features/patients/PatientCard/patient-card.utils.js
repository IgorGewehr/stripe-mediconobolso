/**
 * PatientCard utilities - masks and value helpers
 */

// Apply phone mask
export const applyPhoneMask = (value, mask) => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");

    if (mask === "(99) 99999-9999") {
        // Mobile format
        let result = "";
        if (digits.length > 0) result += "(" + digits.substring(0, 2);
        if (digits.length >= 2) result += ") ";
        if (digits.length > 2) result += digits.substring(2, 7);
        if (digits.length >= 7) result += "-" + digits.substring(7, 11);
        return result;
    } else if (mask === "(99) 9999-9999") {
        // Landline format
        let result = "";
        if (digits.length > 0) result += "(" + digits.substring(0, 2);
        if (digits.length >= 2) result += ") ";
        if (digits.length > 2) result += digits.substring(2, 6);
        if (digits.length >= 6) result += "-" + digits.substring(6, 10);
        return result;
    }

    return value;
};

// Apply CEP mask
export const applyCepMask = (value) => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 5) return digits;
    return digits.substring(0, 5) + "-" + digits.substring(5, 8);
};

// Safely get nested object value
export const getSafeValue = (obj, path, defaultValue = "-") => {
    if (!obj || !path) return defaultValue;

    try {
        const value = path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);

        if (value === undefined || value === null || value === "") {
            return defaultValue;
        }

        return value;
    } catch (error) {
        return defaultValue;
    }
};

// Calculate age from birth date
export const calculateAge = (birthDate) => {
    if (!birthDate) return null;

    try {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    } catch (error) {
        return null;
    }
};

// Format date for display
export const formatDateDisplay = (dateString) => {
    if (!dateString) return "-";

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    } catch (error) {
        return dateString;
    }
};

// Validate email format
export const isValidEmail = (email) => {
    const pattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return pattern.test(email);
};

// Validate phone format
export const isValidPhone = (phone, type = 'mobile') => {
    const digits = phone?.replace(/\D/g, '') || '';
    return type === 'mobile' ? digits.length === 11 : digits.length === 10;
};
