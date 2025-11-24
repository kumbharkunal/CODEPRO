import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export const useRBAC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  const isAdmin = user?.role === 'admin';
  const isDeveloper = user?.role === 'developer';
  
  return {
    role: user?.role,
    isAdmin,
    isDeveloper,
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
};
