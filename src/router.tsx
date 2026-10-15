import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { Spinner } from '@/components/ui/Spinner';

// Lazy loaded page components
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const SetupWizardPage = lazy(() => import('@/features/auth/SetupWizardPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const PatientsPage = lazy(() => import('@/pages/PatientsPage'));
const PatientProfilePage = lazy(() => import('@/features/patients/PatientProfilePage'));
const AppointmentsPage = lazy(() => import('@/pages/AppointmentsPage'));
const TreatmentsPage = lazy(() => import('@/pages/TreatmentsPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const ExpensesPage = lazy(() => import('@/pages/ExpensesPage'));
const InsurancePage = lazy(() => import('@/pages/InsurancePage'));
const ImagingPage = lazy(() => import('@/pages/ImagingPage'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const PrescriptionsPage = lazy(() => import('@/pages/PrescriptionsPage'));
const MedicalReportsPage = lazy(() => import('@/pages/MedicalReportsPage'));
const LabOrdersPage = lazy(() => import('@/pages/LabOrdersPage'));
const StaffPage = lazy(() => import('@/pages/StaffPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const AuditLogPage = lazy(() => import('@/pages/AuditLogPage'));
const ProceduresCatalogPage = lazy(() => import('@/features/procedures/ProceduresCatalogPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const PageLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
    <Spinner size="lg" className="text-brand-blue" />
    <span className="text-xs font-medium text-text-secondary">
      جاري تحميل الصفحة...
    </span>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/setup',
    element: (
      <Suspense fallback={<PageLoader />}>
        <SetupWizardPage />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'patients',
        element: (
          <ProtectedRoute resource="patients">
            <Suspense fallback={<PageLoader />}>
              <PatientsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'patients/:id',
        element: (
          <ProtectedRoute resource="patients">
            <Suspense fallback={<PageLoader />}>
              <PatientProfilePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'appointments',
        element: (
          <ProtectedRoute resource="appointments">
            <Suspense fallback={<PageLoader />}>
              <AppointmentsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'treatments',
        element: (
          <ProtectedRoute resource="treatments">
            <Suspense fallback={<PageLoader />}>
              <TreatmentsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'billing',
        element: (
          <ProtectedRoute resource="invoices">
            <Suspense fallback={<PageLoader />}>
              <BillingPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'expenses',
        element: (
          <ProtectedRoute resource="expenses">
            <Suspense fallback={<PageLoader />}>
              <ExpensesPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'insurance',
        element: (
          <ProtectedRoute resource="invoices">
            <Suspense fallback={<PageLoader />}>
              <InsurancePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'imaging',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ImagingPage />
          </Suspense>
        ),
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute resource="inventory">
            <Suspense fallback={<PageLoader />}>
              <InventoryPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute resource="reports">
            <Suspense fallback={<PageLoader />}>
              <ReportsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'prescriptions',
        element: (
          <ProtectedRoute resource="prescriptions">
            <Suspense fallback={<PageLoader />}>
              <PrescriptionsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'medical-reports',
        element: (
          <ProtectedRoute resource="medical_reports">
            <Suspense fallback={<PageLoader />}>
              <MedicalReportsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'lab-orders',
        element: (
          <ProtectedRoute resource="lab_orders">
            <Suspense fallback={<PageLoader />}>
              <LabOrdersPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'staff',
        element: (
          <ProtectedRoute resource="staff">
            <Suspense fallback={<PageLoader />}>
              <StaffPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute resource="settings">
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'audit-log',
        element: (
          <ProtectedRoute resource="audit_logs">
            <Suspense fallback={<PageLoader />}>
              <AuditLogPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'procedures',
        element: (
          <ProtectedRoute resource="treatments">
            <Suspense fallback={<PageLoader />}>
              <ProceduresCatalogPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);
