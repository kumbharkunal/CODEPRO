import { ReactNode } from 'react';
import { useAppSelector } from '@/store/hooks';

export default function RoleGuard({ roles, children }: { roles: Array<'admin'|'developer'|'viewer'>; children: ReactNode }) {
  const user = useAppSelector(s => s.auth.user);
  if (!user) return null;
  return roles.includes(user.role) ? <>{children}</> : null;
}