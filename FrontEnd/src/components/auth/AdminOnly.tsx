import { ReactNode } from 'react';
import RoleGuard from './RoleGuard';

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * AdminOnly component - Shorthand for admin-only content
 */
export default function AdminOnly({ children, fallback, showError }: AdminOnlyProps) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback} showError={showError}>
      {children}
    </RoleGuard>
  );
}

