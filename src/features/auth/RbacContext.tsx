import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';
import type {
  PermissionsMatrix,
  ClinicSecurityPolicies,
  ResourceName,
  PermissionAction,
} from '@shared/contracts';

interface RbacContextType {
  matrix: PermissionsMatrix | null;
  policies: ClinicSecurityPolicies | null;
  isLoading: boolean;
  can: (resource: ResourceName, action: PermissionAction) => boolean;
  canViewPrices: () => boolean;
  canViewClinicalNotes: () => boolean;
  isDentistRestricted: () => boolean;
  updateMatrix: (matrix: PermissionsMatrix) => Promise<boolean>;
  updatePolicies: (policies: Partial<ClinicSecurityPolicies>) => Promise<boolean>;
  refreshRbac: () => Promise<void>;
}

const RbacContext = createContext<RbacContextType | undefined>(undefined);

export const RbacProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [matrix, setMatrix] = useState<PermissionsMatrix | null>(null);
  const [policies, setPolicies] = useState<ClinicSecurityPolicies | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRbac = useCallback(async () => {
    try {
      const [matrixRes, policiesRes] = await Promise.all([
        api.rbac.getMatrix(),
        api.rbac.getPolicies(),
      ]);

      if (matrixRes.ok && matrixRes.data) {
        setMatrix(matrixRes.data);
      }
      if (policiesRes.ok && policiesRes.data) {
        setPolicies(policiesRes.data);
      }
    } catch (e) {
      console.error('Failed to load RBAC data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRbac();
  }, [fetchRbac]);

  const can = useCallback(
    (resource: ResourceName, action: PermissionAction): boolean => {
      if (!user) return false;
      // Owner always has all permissions
      if (user.role === 'owner') return true;
      if (!matrix) return false;

      const rolePermissions = matrix[user.role];
      if (!rolePermissions) return false;

      const resActions = rolePermissions[resource];
      if (!resActions) return false;

      return !!resActions[action];
    },
    [user, matrix]
  );

  // Strict Rule 1: Receptionist price visibility
  const canViewPrices = useCallback((): boolean => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    if (policies?.receptionist_hide_prices && user.role === 'receptionist') {
      return false;
    }
    return can('prices', 'view');
  }, [user, policies, can]);

  // Strict Rule 2: Accountant clinical notes visibility
  const canViewClinicalNotes = useCallback((): boolean => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    if (policies?.accountant_hide_clinical_notes && user.role === 'accountant') {
      return false;
    }
    return can('clinical_notes', 'view');
  }, [user, policies, can]);

  // Strict Rule 3: Dentist view own patients only
  const isDentistRestricted = useCallback((): boolean => {
    if (!user) return false;
    return !!(policies?.dentist_only_own_patients && user.role === 'dentist');
  }, [user, policies]);

  const updateMatrix = useCallback(
    async (newMatrix: PermissionsMatrix): Promise<boolean> => {
      try {
        const res = await api.rbac.updateMatrix(newMatrix);
        if (res.ok) {
          setMatrix(res.data);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  const updatePolicies = useCallback(
    async (newPolicies: Partial<ClinicSecurityPolicies>): Promise<boolean> => {
      try {
        const res = await api.rbac.updatePolicies(newPolicies);
        if (res.ok) {
          setPolicies(res.data);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  return (
    <RbacContext.Provider
      value={{
        matrix,
        policies,
        isLoading,
        can,
        canViewPrices,
        canViewClinicalNotes,
        isDentistRestricted,
        updateMatrix,
        updatePolicies,
        refreshRbac: fetchRbac,
      }}
    >
      {children}
    </RbacContext.Provider>
  );
};

export const useRbac = () => {
  const context = useContext(RbacContext);
  if (!context) {
    throw new Error('useRbac must be used within an RbacProvider');
  }
  return context;
};
