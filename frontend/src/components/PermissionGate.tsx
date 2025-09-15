import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  adminOnly?: boolean;
}

export const PermissionGate = ({
  permission,
  children,
  fallback = null,
  adminOnly = false
}: PermissionGateProps) => {
  const { hasPermission, isAdmin } = usePermissions();

  // If adminOnly is true, only show to admins
  if (adminOnly && !isAdmin) {
    return <>{fallback}</>;
  }

  // Check if user has the required permission
  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

// Convenience component for admin-only content
export const AdminOnly = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => {
  const { isAdmin } = usePermissions();
  return isAdmin ? <>{children}</> : <>{fallback}</>;
};

// Convenience component for staff-only content (excluding admins)
export const StaffOnly = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => {
  const { isStaff } = usePermissions();
  return isStaff ? <>{children}</> : <>{fallback}</>;
};