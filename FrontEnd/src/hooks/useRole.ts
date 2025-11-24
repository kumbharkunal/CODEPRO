import { useAppSelector } from '@/store/hooks';

export function useRole() {
  const user = useAppSelector(s => s.auth.user);
  const role = user?.role;
  const isAdmin = role === 'admin';
  const isDeveloper = role === 'developer';
  
  return {
    role,
    isAdmin,
    isDeveloper,
    user,
    // Permission checks
    canEdit: isAdmin,
    canDelete: isAdmin,
    canInvite: isAdmin,
    canConnectRepo: isAdmin,
    canDisconnectRepo: isAdmin,
    canManageTeam: isAdmin,
    canManageBilling: isAdmin,
    canUpdateReview: isAdmin,
    canRegenerateReview: isAdmin,
    // Read permissions (both roles)
    canViewRepos: true,
    canViewReviews: true,
    canViewSettings: true,
  };
}
