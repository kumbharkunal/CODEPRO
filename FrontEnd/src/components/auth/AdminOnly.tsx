import { ReactNode } from 'react';
import RoleGuard from './RoleGuard';

export default function AdminOnly({ children }: { children: ReactNode }) {
  return <RoleGuard roles={['admin']}>{children}</RoleGuard>;
}