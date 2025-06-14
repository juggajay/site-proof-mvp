// Application Configuration
export const APP_CONFIG = {
  name: 'Civil Q App',
  version: '1.0.0',
  description: 'Civil Engineering Quality Assurance System',
} as const;

// Database Limits
export const DATABASE_LIMITS = {
  PROJECT_NAME_MAX_LENGTH: 100,
  LOT_NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 500,
  COMMENT_MAX_LENGTH: 1000,
  FILE_SIZE_MAX: 10 * 1024 * 1024, // 10MB
} as const;

// Application Routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  PROJECT: (id: string) => `/project/${id}`,
  LOT: (projectId: string, lotId: string) => `/project/${projectId}/lot/${lotId}`,
  LOT_EDIT: (projectId: string, lotId: string) => `/project/${projectId}/lot/${lotId}/edit`,
  LOT_HISTORY: (projectId: string, lotId: string) => `/project/${projectId}/lot/${lotId}/history`,
  LOT_INSPECTION: (projectId: string, lotId: string) => `/project/${projectId}/lot/${lotId}/inspection/new`,
  DAILY_REPORT: (projectId: string, lotId: string) => `/project/${projectId}/lot/${lotId}/daily-report`,
} as const;

// ITP (Inspection and Test Plan) Constants
export const ITP_CONSTANTS = {
  STATUSES: {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },
  TYPES: {
    EXCAVATION: 'excavation',
    CONCRETE: 'concrete',
    STEEL: 'steel',
    EARTHWORKS: 'earthworks',
    UTILITIES: 'utilities',
  },
} as const;

// Lot Status Constants
export const LOT_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
} as const;

// Quality Assurance Constants
export const QA_CONSTANTS = {
  INSPECTION_TYPES: {
    VISUAL: 'visual',
    DIMENSIONAL: 'dimensional',
    MATERIAL_TEST: 'material_test',
    COMPLIANCE_CHECK: 'compliance_check',
  },
  COMPLIANCE_LEVELS: {
    COMPLIANT: 'compliant',
    NON_COMPLIANT: 'non_compliant',
    CONDITIONAL: 'conditional',
  },
} as const;

// UI Constants
export const UI_CONSTANTS = {
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  PAGINATION_SIZE: 10,
  MAX_FILE_UPLOADS: 5,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  FILE_TOO_LARGE: `File size must be less than ${DATABASE_LIMITS.FILE_SIZE_MAX / 1024 / 1024}MB`,
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PROJECT_CREATED: 'Project created successfully',
  LOT_CREATED: 'Lot created successfully',
  LOT_UPDATED: 'Lot updated successfully',
  INSPECTION_COMPLETED: 'Inspection completed successfully',
  REPORT_SAVED: 'Report saved successfully',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  FILE_NAME: 'yyyyMMdd_HHmmss',
} as const;

// Environment Constants
export const ENV_CONSTANTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;