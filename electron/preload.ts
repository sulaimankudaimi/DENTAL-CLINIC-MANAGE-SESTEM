import { contextBridge, ipcRenderer } from 'electron';
import type { EyadatiApi, EyadatiSystemApi } from '@shared/contracts';

const systemApi: EyadatiSystemApi = {
  openFile: (options) => ipcRenderer.invoke('system:openFile', options),
  saveFile: (options) => ipcRenderer.invoke('system:saveFile', options),
  printDocument: (options) => ipcRenderer.invoke('system:printDocument', options),
  exportPdf: (targetPath) => ipcRenderer.invoke('system:exportPdf', targetPath),
  getAppVersion: () => ipcRenderer.invoke('system:getAppVersion'),
  checkForUpdates: () => ipcRenderer.invoke('system:checkForUpdates'),
  backupNow: (options) => ipcRenderer.invoke('system:backupNow', options),
  restoreBackup: (filePath, password) => ipcRenderer.invoke('system:restoreBackup', filePath, password),
  showItemInFolder: (fullPath) => ipcRenderer.invoke('system:showItemInFolder', fullPath),
};

const api: EyadatiApi = {
  patients: {
    list: (filters) => ipcRenderer.invoke('patients:list', filters),
    getById: (id) => ipcRenderer.invoke('patients:getById', id),
    create: (data) => ipcRenderer.invoke('patients:create', data),
    update: (id, data) => ipcRenderer.invoke('patients:update', id, data),
    delete: (id) => ipcRenderer.invoke('patients:delete', id),
    search: (query, page, limit) => ipcRenderer.invoke('patients:search', query, page, limit),
    getMedicalHistory: (patientId) => ipcRenderer.invoke('patients:getMedicalHistory', patientId),
    saveMedicalHistory: (data) => ipcRenderer.invoke('patients:saveMedicalHistory', data),
    getAllergies: (patientId) => ipcRenderer.invoke('patients:getAllergies', patientId),
    saveAllergy: (data) => ipcRenderer.invoke('patients:saveAllergy', data),
    deleteAllergy: (id) => ipcRenderer.invoke('patients:deleteAllergy', id),
  },

  toothRecords: {
    getByPatient: (patientId) => ipcRenderer.invoke('toothRecords:getByPatient', patientId),
    saveRecord: (data) => ipcRenderer.invoke('toothRecords:saveRecord', data),
    deleteRecord: (id) => ipcRenderer.invoke('toothRecords:deleteRecord', id),
  },

  appointments: {
    list: (filters) => ipcRenderer.invoke('appointments:list', filters),
    getById: (id) => ipcRenderer.invoke('appointments:getById', id),
    create: (data) => ipcRenderer.invoke('appointments:create', data),
    update: (id, data) => ipcRenderer.invoke('appointments:update', id, data),
    delete: (id) => ipcRenderer.invoke('appointments:delete', id),
    updateStatus: (id, status) => ipcRenderer.invoke('appointments:updateStatus', id, status),
    getWeek: (from, to, dentistId) => ipcRenderer.invoke('appointments:getWeek', from, to, dentistId),
    getToday: (dentistId) => ipcRenderer.invoke('appointments:getToday', dentistId),
  },

  rooms: {
    list: () => ipcRenderer.invoke('rooms:list'),
    getById: (id) => ipcRenderer.invoke('rooms:getById', id),
    updateStatus: (id, status) => ipcRenderer.invoke('rooms:updateStatus', id, status),
    create: (data) => ipcRenderer.invoke('rooms:create', data),
    update: (id, data) => ipcRenderer.invoke('rooms:update', id, data),
    delete: (id) => ipcRenderer.invoke('rooms:delete', id),
  },

  treatments: {
    list: (filters) => ipcRenderer.invoke('treatments:list', filters),
    getById: (id) => ipcRenderer.invoke('treatments:getById', id),
    create: (data) => ipcRenderer.invoke('treatments:create', data),
    update: (id, data) => ipcRenderer.invoke('treatments:update', id, data),
    delete: (id) => ipcRenderer.invoke('treatments:delete', id),
    getPlansByPatient: (patientId) => ipcRenderer.invoke('treatments:getPlansByPatient', patientId),
    getPlanById: (id) => ipcRenderer.invoke('treatments:getPlanById', id),
    createPlan: (data) => ipcRenderer.invoke('treatments:createPlan', data),
    updatePlan: (id, data) => ipcRenderer.invoke('treatments:updatePlan', id, data),
    deletePlan: (id) => ipcRenderer.invoke('treatments:deletePlan', id),
    getProcedures: (filters) => ipcRenderer.invoke('treatments:getProcedures', filters),
    createProcedure: (data) => ipcRenderer.invoke('treatments:createProcedure', data),
    updateProcedure: (id, data) => ipcRenderer.invoke('treatments:updateProcedure', id, data),
    deleteProcedure: (id) => ipcRenderer.invoke('treatments:deleteProcedure', id),
    bulkUpsertProcedures: (data) => ipcRenderer.invoke('treatments:bulkUpsertProcedures', data),
    acceptPlanTransaction: (data) => ipcRenderer.invoke('treatments:acceptPlanTransaction', data),
    executeTreatmentTransaction: (data) => ipcRenderer.invoke('treatments:executeTreatmentTransaction', data),
  },

  invoices: {
    list: (filters) => ipcRenderer.invoke('invoices:list', filters),
    getById: (id) => ipcRenderer.invoke('invoices:getById', id),
    create: (data) => ipcRenderer.invoke('invoices:create', data),
    update: (id, data) => ipcRenderer.invoke('invoices:update', id, data),
    voidInvoice: (id, reason) => ipcRenderer.invoke('invoices:voidInvoice', id, reason),
    getStats: (range) => ipcRenderer.invoke('invoices:getStats', range),
  },

  payments: {
    list: (params) => ipcRenderer.invoke('payments:list', params),
    create: (data) => ipcRenderer.invoke('payments:create', data),
    getByInvoice: (invoiceId) => ipcRenderer.invoke('payments:getByInvoice', invoiceId),
  },

  expenses: {
    list: (filters) => ipcRenderer.invoke('expenses:list', filters),
    getById: (id) => ipcRenderer.invoke('expenses:getById', id),
    create: (data) => ipcRenderer.invoke('expenses:create', data),
    update: (id, data) => ipcRenderer.invoke('expenses:update', id, data),
    delete: (id) => ipcRenderer.invoke('expenses:delete', id),
    processRecurring: () => ipcRenderer.invoke('expenses:processRecurring'),
  },

  insurance: {
    getCompanies: () => ipcRenderer.invoke('insurance:getCompanies'),
    createCompany: (data) => ipcRenderer.invoke('insurance:createCompany', data),
    updateCompany: (id, data) => ipcRenderer.invoke('insurance:updateCompany', id, data),
    deleteCompany: (id) => ipcRenderer.invoke('insurance:deleteCompany', id),
    getClaims: (filters) => ipcRenderer.invoke('insurance:getClaims', filters),
    getClaimById: (id) => ipcRenderer.invoke('insurance:getClaimById', id),
    createClaim: (data) => ipcRenderer.invoke('insurance:createClaim', data),
    updateClaim: (id, data) => ipcRenderer.invoke('insurance:updateClaim', id, data),
    transitionClaimStatus: (id, status, payload) => ipcRenderer.invoke('insurance:transitionClaimStatus', id, status, payload),
    getExpiringPolicies: (daysThreshold) => ipcRenderer.invoke('insurance:getExpiringPolicies', daysThreshold),
    getAuditLogs: (entityType, entityId) => ipcRenderer.invoke('insurance:getAuditLogs', entityType, entityId),
  },

  images: {
    list: (params) => ipcRenderer.invoke('images:list', params),
    getByPatient: (patientId) => ipcRenderer.invoke('images:getByPatient', patientId),
    create: (data) => ipcRenderer.invoke('images:create', data),
    delete: (id) => ipcRenderer.invoke('images:delete', id),
  },

  inventory: {
    list: (params) => ipcRenderer.invoke('inventory:list', params),
    getById: (id) => ipcRenderer.invoke('inventory:getById', id),
    create: (data) => ipcRenderer.invoke('inventory:create', data),
    update: (id, data) => ipcRenderer.invoke('inventory:update', id, data),
    delete: (id) => ipcRenderer.invoke('inventory:delete', id),
    recordTransaction: (data) => ipcRenderer.invoke('inventory:recordTransaction', data),
    getTransactions: (params) => ipcRenderer.invoke('inventory:getTransactions', params),
    getLowStock: () => ipcRenderer.invoke('inventory:getLowStock'),
    getExpiringItems: (daysThreshold) => ipcRenderer.invoke('inventory:getExpiringItems', daysThreshold),
    getMonthlyConsumptionReport: (month, year) => ipcRenderer.invoke('inventory:getMonthlyConsumptionReport', month, year),
    getSuppliers: () => ipcRenderer.invoke('inventory:getSuppliers'),
    createSupplier: (data) => ipcRenderer.invoke('inventory:createSupplier', data),
    updateSupplier: (id, data) => ipcRenderer.invoke('inventory:updateSupplier', id, data),
    deleteSupplier: (id) => ipcRenderer.invoke('inventory:deleteSupplier', id),
    getPurchaseOrders: () => ipcRenderer.invoke('inventory:getPurchaseOrders'),
    createPurchaseOrder: (data) => ipcRenderer.invoke('inventory:createPurchaseOrder', data),
    updatePurchaseOrderStatus: (id, status) => ipcRenderer.invoke('inventory:updatePurchaseOrderStatus', id, status),
    receivePurchaseOrder: (id, payload) => ipcRenderer.invoke('inventory:receivePurchaseOrder', id, payload),
  },

  staff: {
    list: (filters) => ipcRenderer.invoke('staff:list', filters),
    getById: (id) => ipcRenderer.invoke('staff:getById', id),
    create: (data) => ipcRenderer.invoke('staff:create', data),
    update: (id, data) => ipcRenderer.invoke('staff:update', id, data),
    getAttendance: (userId, date) => ipcRenderer.invoke('staff:getAttendance', userId, date),
    recordAttendance: (data) => ipcRenderer.invoke('staff:recordAttendance', data),
    getLeaves: (userId) => ipcRenderer.invoke('staff:getLeaves', userId),
    createLeave: (data) => ipcRenderer.invoke('staff:createLeave', data),
    updateLeaveStatus: (id, status, reviewedBy) => ipcRenderer.invoke('staff:updateLeaveStatus', id, status, reviewedBy),
    getCommissions: (filters) => ipcRenderer.invoke('staff:getCommissions', filters),
  },

  reports: {
    getReport: (reportId, filters) => ipcRenderer.invoke('reports:getReport', reportId, filters),
    getFinancialReport: (from, to) => ipcRenderer.invoke('reports:getFinancialReport', from, to),
    getDoctorPerformance: (dentistId, from, to) => ipcRenderer.invoke('reports:getDoctorPerformance', dentistId, from, to),
    getFinancials: (range) => ipcRenderer.invoke('reports:getFinancials', range),
    getRevenueReport: (filters) => ipcRenderer.invoke('reports:getRevenueReport', filters),
    getIncomeStatement: (filters) => ipcRenderer.invoke('reports:getIncomeStatement', filters),
    getAgingReport: () => ipcRenderer.invoke('reports:getAgingReport'),
    getDoctorCommissions: (filters) => ipcRenderer.invoke('reports:getDoctorCommissions', filters),
    getVatReport: (filters) => ipcRenderer.invoke('reports:getVatReport', filters),
    getDailyCashClosing: (date, userId) => ipcRenderer.invoke('reports:getDailyCashClosing', date, userId),
    getScheduledReports: () => ipcRenderer.invoke('reports:getScheduledReports'),
    createScheduledReport: (data) => ipcRenderer.invoke('reports:createScheduledReport', data),
    updateScheduledReport: (id, data) => ipcRenderer.invoke('reports:updateScheduledReport', id, data),
    deleteScheduledReport: (id) => ipcRenderer.invoke('reports:deleteScheduledReport', id),
    runScheduledReportNow: (id) => ipcRenderer.invoke('reports:runScheduledReportNow', id),
    getReportHistory: () => ipcRenderer.invoke('reports:getReportHistory'),
  },

  settings: {
    getClinic: () => ipcRenderer.invoke('settings:getClinic'),
    updateClinic: (data) => ipcRenderer.invoke('settings:updateClinic', data),
    getSettings: () => ipcRenderer.invoke('settings:getSettings'),
    setSetting: (key, value) => ipcRenderer.invoke('settings:setSetting', key, value),
  },

  dashboard: {
    getTodaySummary: () => ipcRenderer.invoke('dashboard:getTodaySummary'),
  },

  prescriptions: {
    list: (params) => ipcRenderer.invoke('prescriptions:list', params),
    getByPatient: (patientId) => ipcRenderer.invoke('prescriptions:getByPatient', patientId),
    getById: (id) => ipcRenderer.invoke('prescriptions:getById', id),
    create: (data) => ipcRenderer.invoke('prescriptions:create', data),
    delete: (id) => ipcRenderer.invoke('prescriptions:delete', id),
  },

  medicalReports: {
    list: (params) => ipcRenderer.invoke('medicalReports:list', params),
    getByPatient: (patientId) => ipcRenderer.invoke('medicalReports:getByPatient', patientId),
    getById: (id) => ipcRenderer.invoke('medicalReports:getById', id),
    create: (data) => ipcRenderer.invoke('medicalReports:create', data),
    update: (id, data) => ipcRenderer.invoke('medicalReports:update', id, data),
    delete: (id) => ipcRenderer.invoke('medicalReports:delete', id),
  },

  labOrders: {
    list: (params) => ipcRenderer.invoke('labOrders:list', params),
    getById: (id) => ipcRenderer.invoke('labOrders:getById', id),
    create: (data) => ipcRenderer.invoke('labOrders:create', data),
    update: (id, data) => ipcRenderer.invoke('labOrders:update', id, data),
    delete: (id) => ipcRenderer.invoke('labOrders:delete', id),
    updateStatus: (id, status, received_at) => ipcRenderer.invoke('labOrders:updateStatus', id, status, received_at),
    getOverdue: () => ipcRenderer.invoke('labOrders:getOverdue'),
  },

  labs: {
    list: () => ipcRenderer.invoke('labs:list'),
    getById: (id) => ipcRenderer.invoke('labs:getById', id),
    create: (data) => ipcRenderer.invoke('labs:create', data),
    update: (id, data) => ipcRenderer.invoke('labs:update', id, data),
    delete: (id) => ipcRenderer.invoke('labs:delete', id),
  },

  auth: {
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
    quickUnlockPin: (payload) => ipcRenderer.invoke('auth:quickUnlockPin', payload),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
    me: () => ipcRenderer.invoke('auth:me'),
    unlockAccount: (userId) => ipcRenderer.invoke('auth:unlockAccount', userId),
    resetPin: (userId, newPin) => ipcRenderer.invoke('auth:resetPin', userId, newPin),
    resetPassword: (userId, newPassword) => ipcRenderer.invoke('auth:resetPassword', userId, newPassword),
    changePassword: (payload) => ipcRenderer.invoke('auth:changePassword', payload),
    needsSetup: () => ipcRenderer.invoke('auth:needsSetup'),
    setupFirstRun: (payload) => ipcRenderer.invoke('auth:setupFirstRun', payload),
  },

  auditLogs: {
    list: (filters) => ipcRenderer.invoke('auditLogs:list', filters),
    getById: (id) => ipcRenderer.invoke('auditLogs:getById', id),
    export: (filters) => ipcRenderer.invoke('auditLogs:export', filters),
  },

  rbac: {
    getMatrix: () => ipcRenderer.invoke('rbac:getMatrix'),
    updateMatrix: (matrix) => ipcRenderer.invoke('rbac:updateMatrix', matrix),
    getPolicies: () => ipcRenderer.invoke('rbac:getPolicies'),
    updatePolicies: (policies) => ipcRenderer.invoke('rbac:updatePolicies', policies),
  },

  license: {
    getStatus: () => ipcRenderer.invoke('license:getStatus'),
    getDeviceCode: () => ipcRenderer.invoke('license:getDeviceCode'),
    activate: (token) => ipcRenderer.invoke('license:activate', token),
    activateOnline: (code) => ipcRenderer.invoke('license:activateOnline', code),
    deactivate: () => ipcRenderer.invoke('license:deactivate'),
  },

  // System shortcuts on root object
  system: systemApi,
  openFile: systemApi.openFile,
  saveFile: systemApi.saveFile,
  printDocument: systemApi.printDocument,
  exportPdf: systemApi.exportPdf,
  getAppVersion: systemApi.getAppVersion,
  checkForUpdates: systemApi.checkForUpdates,
  backupNow: systemApi.backupNow,
  restoreBackup: systemApi.restoreBackup,
  showItemInFolder: systemApi.showItemInFolder,
};

// Expose in main world securely
contextBridge.exposeInMainWorld('eyadati', api);
contextBridge.exposeInMainWorld('eyadatiSystem', systemApi);
