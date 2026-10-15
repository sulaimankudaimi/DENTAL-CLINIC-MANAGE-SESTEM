import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useRbac } from './RbacContext';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';
import { RESOURCE_NAME_AR } from '@shared/contracts';
import type { ResourceName, PermissionAction } from '@shared/contracts';

interface ProtectedRouteProps {
  children: React.ReactNode;
  resource?: ResourceName;
  action?: PermissionAction;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  resource,
  action = 'view',
}) => {
  const { user, isLoading, isLoggedIn } = useAuth();
  const { can } = useRbac();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size="lg" className="text-brand-blue" />
        <span className="text-xs text-text-secondary">جاري التحقق من الصلاحيات...</span>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check permission if resource specified
  if (resource && !can(resource, action)) {
    const resourceName = RESOURCE_NAME_AR[resource] || resource;
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center animate-fadeIn" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-status-danger-bg text-status-danger-fg flex items-center justify-center mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-2">
          غير مصرّح بالوصول (403)
        </h2>
        <p className="text-sm text-text-secondary max-w-md mb-6 leading-relaxed">
          عذراً، دورك الوظيفي الحالي لا يمتلك صلاحية الوصول إلى قسم{' '}
          <span className="font-bold text-text-primary">«{resourceName}»</span>. يرجى مراجعة إدارة العيادة لتعديل صلاحيات حسابك من مصفوفة الصلاحيات (RBAC).
        </p>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للخلف</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <Home className="w-4 h-4" />
            <span>لوحة التحكم الرئيسية</span>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
