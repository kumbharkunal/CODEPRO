import { ReactNode } from 'react';
import { useRBAC } from '../../hooks/useRBAC';

interface RoleBasedWrapperProps {
  children: ReactNode;
  allowedRoles: ('admin' | 'developer')[];
  fallback?: ReactNode;
  showMessage?: boolean;
}

export const RoleBasedWrapper = ({
  children,
  allowedRoles,
  fallback = null,
  showMessage = false
}: RoleBasedWrapperProps) => {
  const { role } = useRBAC();

  if (!role || !allowedRoles.includes(role as any)) {
    if (showMessage) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          This feature is only available to {allowedRoles.join(' and ')}s
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
