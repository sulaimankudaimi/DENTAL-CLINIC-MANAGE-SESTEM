import React from 'react';
import { useRbac } from './RbacContext';
import type { ResourceName, PermissionAction } from '@shared/contracts';

export interface CanProps {
  resource: ResourceName;
  action: PermissionAction;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  resource,
  action,
  fallback = null,
  children,
}) => {
  const { can, canViewPrices, canViewClinicalNotes } = useRbac();

  // Special resource handling
  if (resource === 'prices' && action === 'view') {
    if (!canViewPrices()) {
      return <>{fallback}</>;
    }
  }

  if (resource === 'clinical_notes' && action === 'view') {
    if (!canViewClinicalNotes()) {
      return <>{fallback}</>;
    }
  }

  const isAllowed = can(resource, action);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default Can;
