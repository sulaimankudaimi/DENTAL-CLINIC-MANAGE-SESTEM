export const queryKeys = {
  // Patients
  patients: {
    all: ['patients'] as const,
    list: (filters: Record<string, unknown>) => ['patients', 'list', filters] as const,
    detail: (id: string) => ['patients', 'detail', id] as const,
    search: (query: string) => ['patients', 'search', query] as const,
    medicalHistory: (patientId: string) => ['patients', 'medicalHistory', patientId] as const,
    allergies: (patientId: string) => ['patients', 'allergies', patientId] as const,
  },

  // Tooth Records (Odontogram)
  toothRecords: {
    byPatient: (patientId: string) => ['toothRecords', 'patient', patientId] as const,
  },

  // Appointments
  appointments: {
    all: ['appointments'] as const,
    list: (filters: Record<string, unknown>) => ['appointments', 'list', filters] as const,
    detail: (id: string) => ['appointments', 'detail', id] as const,
    week: (from: string, to: string, dentistId?: string) => ['appointments', 'week', { from, to, dentistId }] as const,
    today: (dentistId?: string) => ['appointments', 'today', dentistId] as const,
  },

  // Rooms
  rooms: {
    all: ['rooms'] as const,
    detail: (id: string) => ['rooms', 'detail', id] as const,
  },

  // Treatments
  treatments: {
    all: ['treatments'] as const,
    list: (filters: Record<string, unknown>) => ['treatments', 'list', filters] as const,
    detail: (id: string) => ['treatments', 'detail', id] as const,
    plans: (patientId: string) => ['treatments', 'plans', patientId] as const,
    procedures: (filters?: Record<string, unknown>) => ['treatments', 'procedures', filters] as const,
  },

  // Invoices & Billing
  invoices: {
    all: ['invoices'] as const,
    list: (filters: Record<string, unknown>) => ['invoices', 'list', filters] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
    stats: (range?: Record<string, unknown>) => ['invoices', 'stats', range] as const,
    installments: (invoiceId: string) => ['invoices', 'installments', invoiceId] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    byInvoice: (invoiceId: string) => ['payments', 'invoice', invoiceId] as const,
  },

  // Insurance
  insurance: {
    companies: ['insurance', 'companies'] as const,
    claims: (filters?: Record<string, unknown>) => ['insurance', 'claims', filters] as const,
    claim: (id: string) => ['insurance', 'claim', id] as const,
    expiringPolicies: (days?: number) => ['insurance', 'expiringPolicies', days] as const,
    auditLogs: (entityType?: string, entityId?: string) => ['insurance', 'auditLogs', entityType, entityId] as const,
  },

  // Images
  images: {
    all: ['images'] as const,
    byPatient: (patientId: string) => ['images', 'patient', patientId] as const,
  },

  // Inventory
  inventory: {
    all: ['inventory'] as const,
    list: (params?: Record<string, unknown>) => ['inventory', 'list', params] as const,
    detail: (id: string) => ['inventory', 'detail', id] as const,
    lowStock: ['inventory', 'lowStock'] as const,
    expiringItems: (days?: number) => ['inventory', 'expiringItems', days] as const,
    transactions: (filters?: Record<string, unknown>) => ['inventory', 'transactions', filters] as const,
    monthlyReport: (month?: string, year?: number) => ['inventory', 'monthlyReport', { month, year }] as const,
    suppliers: ['inventory', 'suppliers'] as const,
    purchaseOrders: ['inventory', 'purchaseOrders'] as const,
  },

  // Staff
  staff: {
    all: ['staff'] as const,
    list: (params?: Record<string, unknown>) => ['staff', 'list', params] as const,
    detail: (id: string) => ['staff', 'detail', id] as const,
    attendance: (userId?: string, date?: string) => ['staff', 'attendance', { userId, date }] as const,
    leaves: (userId?: string) => ['staff', 'leaves', userId] as const,
    commissions: (filters?: Record<string, unknown>) => ['staff', 'commissions', filters] as const,
  },

  // Auth & RBAC & Audit
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
  },
  rbac: {
    matrix: ['rbac', 'matrix'] as const,
    policies: ['rbac', 'policies'] as const,
  },
  auditLogs: {
    all: ['auditLogs'] as const,
    list: (filters?: Record<string, unknown>) => ['auditLogs', 'list', filters] as const,
    detail: (id: string) => ['auditLogs', 'detail', id] as const,
  },

  // Reports
  reports: {
    financial: (from: string, to: string) => ['reports', 'financial', { from, to }] as const,
    financials: (range?: Record<string, unknown>) => ['reports', 'financials', range] as const,
    doctorPerformance: (dentistId: string, from?: string, to?: string) => ['reports', 'performance', { dentistId, from, to }] as const,
    scheduled: ['reports', 'scheduled'] as const,
    history: ['reports', 'history'] as const,
  },

  // Settings
  settings: {
    clinic: ['settings', 'clinic'] as const,
    all: ['settings', 'all'] as const,
  },

  // Dashboard
  dashboard: {
    todaySummary: ['dashboard', 'todaySummary'] as const,
  },
};
