/**
 * User Model
 *
 * Data structure for user accounts (doctors, admins, secretaries).
 */

/**
 * User data model
 * @typedef {Object} User
 */
export const UserModel = {
  // Basic info
  fullName: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  cpf: '',
  photoURL: '',

  // Address
  address: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil'
  },

  // Professional info
  crm: '',
  specialty: '',
  clinicName: '',
  clinicAddress: '',

  // Account settings
  gratuito: true,
  assinouPlano: false,
  planType: 'free', // 'free', 'monthly', 'annual', 'enterprise'
  administrador: false,
  checkoutCompleted: false,

  // Auth info
  authProvider: 'email', // 'email', 'google'
  emailVerified: false,
  googleProfile: null,

  // Modules and permissions
  modules: {},
  limitations: {},
  customModules: {},

  // Secretary info (if applicable)
  isSecretary: false,
  secretaryOf: null, // Doctor ID
  secretaryPermissions: {},

  // Tracking
  referralSource: null,
  enrico: false,

  // Activity
  isCurrentlyOnline: false,
  lastLogin: null,
  lastLoginMethod: '',
  lastUserAgent: '',
  lastPlatform: '',
  loginCount: 0,

  // Control fields
  createdAt: null,
  updatedAt: null
};

/**
 * Secretary data model
 * @typedef {Object} Secretary
 */
export const SecretaryModel = {
  doctorId: '',
  secretaryId: '',
  name: '',
  email: '',
  phone: '',

  // Permissions
  permissions: {
    canViewPatients: true,
    canEditPatients: false,
    canViewAppointments: true,
    canEditAppointments: true,
    canViewPrescriptions: false,
    canViewExams: false,
    canViewNotes: false,
    canViewSensitiveData: false
  },

  // Status
  isActive: true,
  createdAt: null,
  updatedAt: null
};

/**
 * Create a new user object with defaults
 * @param {Partial<User>} data - User data
 * @returns {User} User object
 */
export function createUser(data = {}) {
  return {
    ...UserModel,
    ...data,
    createdAt: data.createdAt || new Date(),
    updatedAt: new Date()
  };
}

/**
 * Create a secretary object
 * @param {Partial<Secretary>} data - Secretary data
 * @returns {Secretary} Secretary object
 */
export function createSecretary(data = {}) {
  return {
    ...SecretaryModel,
    ...data,
    createdAt: data.createdAt || new Date(),
    updatedAt: new Date()
  };
}

/**
 * Validate user data
 * @param {Partial<User>} data - User data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateUser(data) {
  const errors = [];

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push('Nome completo é obrigatório');
  }

  if (!data.email) {
    errors.push('Email é obrigatório');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get user display name
 * @param {Partial<User>} user - User object
 * @returns {string} Display name
 */
export function getUserDisplayName(user) {
  if (!user) return '';
  return user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
}

/**
 * Get user plan label
 * @param {Partial<User>} user - User object
 * @returns {string} Plan label
 */
export function getUserPlanLabel(user) {
  if (!user) return 'Gratuito';
  if (user.administrador) return 'Admin';
  if (user.planType === 'enterprise') return 'Enterprise';
  if (user.planType === 'annual') return 'Anual';
  if (user.planType === 'monthly') return 'Mensal';
  if (user.assinouPlano) return 'Premium';
  return 'Gratuito';
}

/**
 * Plan types
 */
export const PLAN_TYPES = {
  FREE: 'free',
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
  ENTERPRISE: 'enterprise'
};

/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  SECRETARY: 'secretary'
};

export default UserModel;
