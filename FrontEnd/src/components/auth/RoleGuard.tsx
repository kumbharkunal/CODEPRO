import { ReactNode } from 'react';
import { useAppSelector } from '@/store/hooks';

interface RoleGuardProps {
  allowedRoles: ('admin' | 'developer' | 'viewer')[];
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * RoleGuard component - Conditionally renders children based on user role
 * 
 * @example
 * <RoleGuard allowedRoles={['admin']}>
 *   <AdminPanel />
 * </RoleGuard>
 */
export default function RoleGuard({ 
  allowedRoles, 
  children, 
  fallback = null,
  showError = false 
}: RoleGuardProps) {
  const user = useAppSelector(state => state.auth.user);
  
  if (!user) {
    return showError ? (
      <div className="p-4 text-center text-muted-foreground">
        Please log in to access this content.
      </div>
    ) : <>{fallback}</>;
  }

  if (!allowedRoles.includes(user.role)) {
    return showError ? (
      <div className="p-4 text-center">
        <p className="text-destructive font-medium">
          Access Denied
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          You don't have permission to access this content. Required role: {allowedRoles.join(' or ')}.
        </p>
      </div>
    ) : <>{fallback}</>;
  }

  return <>{children}</>;
}

