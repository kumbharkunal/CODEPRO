# Frontend RBAC Implementation Guide

## Quick Start for Frontend Developers

### 1. useRBAC Hook

Create `FrontEnd/src/hooks/useRBAC.ts`:

```typescript
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
    canEdit: isAdmin,
    canDelete: isAdmin,
    canInvite: isAdmin,
    canConnectRepo: isAdmin,
    canManageTeam: isAdmin,
    canManageBilling: isAdmin,
  };
};
```

### 2. Team API Service

Create `FrontEnd/src/services/teamService.ts`:

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const teamService = {
  // Get current user's team
  getMyTeam: async (token: string) => {
    const response = await axios.get(`${API_URL}/team`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Update team name (admin only)
  updateTeam: async (name: string, token: string) => {
    const response = await axios.patch(
      `${API_URL}/team`,
      { name },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get team members
  getTeamMembers: async (token: string) => {
    const response = await axios.get(`${API_URL}/team/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Remove member (admin only)
  removeMember: async (memberId: string, token: string) => {
    const response = await axios.delete(`${API_URL}/team/members/${memberId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
```

### 3. Invitation API Service

Create `FrontEnd/src/services/invitationService.ts`:

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const invitationService = {
  // Create invitation (admin only)
  createInvitation: async (email: string, token: string) => {
    const response = await axios.post(
      `${API_URL}/invitations`,
      { email },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  // Get team invitations (admin only)
  getTeamInvitations: async (token: string) => {
    const response = await axios.get(`${API_URL}/invitations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get invitation by token (public)
  getInvitationByToken: async (token: string) => {
    const response = await axios.get(`${API_URL}/invitations/token/${token}`);
    return response.data;
  },

  // Accept invitation
  acceptInvitation: async (token: string, authToken: string) => {
    const response = await axios.post(
      `${API_URL}/invitations/${token}/accept`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  },

  // Revoke invitation (admin only)
  revokeInvitation: async (invitationId: string, token: string) => {
    const response = await axios.delete(`${API_URL}/invitations/${invitationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
```

### 4. RoleBasedWrapper Component

Create `FrontEnd/src/components/auth/RoleBasedWrapper.tsx`:

```typescript
import { ReactNode } from 'react';
import { useRBAC } from '../../hooks/useRBAC';

interface RoleBasedWrapperProps {
  children: ReactNode;
  allowedRoles: ('admin' | 'developer')[];
  fallback?: ReactNode;
}

export const RoleBasedWrapper = ({ 
  children, 
  allowedRoles, 
  fallback = null 
}: RoleBasedWrapperProps) => {
  const { role } = useRBAC();
  
  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
```

### 5. Usage Examples

#### Example 1: Hide Button for Developers

```typescript
import { useRBAC } from '../hooks/useRBAC';

const RepositoriesPage = () => {
  const { canConnectRepo } = useRBAC();
  
  return (
    <div>
      <h1>Repositories</h1>
      {canConnectRepo && (
        <button onClick={handleConnectRepo}>
          Connect Repository
        </button>
      )}
      {/* List repositories */}
    </div>
  );
};
```

#### Example 2: Using RoleBasedWrapper

```typescript
import { RoleBasedWrapper } from '../components/auth/RoleBasedWrapper';

const ReviewDetailPage = () => {
  return (
    <div>
      <h1>Review Details</h1>
      
      <RoleBasedWrapper allowedRoles={['admin']}>
        <button onClick={handleDelete}>Delete Review</button>
        <button onClick={handleRegenerate}>Regenerate</button>
      </RoleBasedWrapper>
      
      {/* Review content visible to all */}
    </div>
  );
};
```

#### Example 3: Conditional Navigation

```typescript
import { useRBAC } from '../hooks/useRBAC';

const Navigation = () => {
  const { isAdmin, role } = useRBAC();
  
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/repositories">Repositories</Link>
      <Link to="/reviews">Reviews</Link>
      {isAdmin && <Link to="/team">Team</Link>}
      <Link to="/settings">Settings</Link>
      
      {/* Show role badge */}
      <span className="role-badge">{role?.toUpperCase()}</span>
    </nav>
  );
};
```

#### Example 4: Read-Only Form

```typescript
import { useRBAC } from '../hooks/useRBAC';

const SettingsPage = () => {
  const { isAdmin, isDeveloper } = useRBAC();
  
  return (
    <div>
      <h1>Settings</h1>
      
      {isDeveloper && (
        <div className="alert alert-info">
          Contact your team admin to change settings
        </div>
      )}
      
      <form>
        <input 
          type="text" 
          name="name" 
          disabled={isDeveloper}
        />
        <input 
          type="email" 
          name="email" 
          disabled={isDeveloper}
        />
        
        {isAdmin && (
          <button type="submit">Save Changes</button>
        )}
      </form>
    </div>
  );
};
```

### 6. Team Management Page

Create `FrontEnd/src/pages/TeamManagementPage.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { teamService } from '../services/teamService';
import { invitationService } from '../services/invitationService';
import { useRBAC } from '../hooks/useRBAC';
import toast from 'react-hot-toast';

const TeamManagementPage = () => {
  const { getToken } = useAuth();
  const { isAdmin } = useRBAC();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      const token = await getToken();
      const [teamData, membersData, invitationsData] = await Promise.all([
        teamService.getMyTeam(token),
        teamService.getTeamMembers(token),
        isAdmin ? invitationService.getTeamInvitations(token) : Promise.resolve([]),
      ]);
      setTeam(teamData);
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (error) {
      toast.error('Failed to load team data');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      const result = await invitationService.createInvitation(inviteEmail, token);
      toast.success(`Invitation sent to ${inviteEmail}`);
      
      // Copy invitation link to clipboard
      navigator.clipboard.writeText(result.invitationLink);
      toast.success('Invitation link copied to clipboard');
      
      setInviteEmail('');
      loadTeamData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeInvitation = async (invitationId) => {
    if (!confirm('Revoke this invitation?')) return;
    
    try {
      const token = await getToken();
      await invitationService.revokeInvitation(invitationId, token);
      toast.success('Invitation revoked');
      loadTeamData();
    } catch (error) {
      toast.error('Failed to revoke invitation');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member from the team?')) return;
    
    try {
      const token = await getToken();
      await teamService.removeMember(memberId, token);
      toast.success('Member removed');
      loadTeamData();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Team</h1>
        <p>Only team admins can manage team settings.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Team Management</h1>
      
      {/* Team Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Team Information</h2>
        <p className="text-lg">{team?.name}</p>
      </div>
      
      {/* Invite Member */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Invite Developer</h2>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="developer@example.com"
            className="flex-1 px-4 py-2 border rounded-lg"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>
      
      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
          <div className="space-y-2">
            {invitations
              .filter(inv => inv.status === 'pending')
              .map(invitation => (
                <div key={invitation._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-gray-500">
                      Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevokeInvitation(invitation._id)}
                    className="px-4 py-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    Revoke
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Team Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Team Members</h2>
        <div className="space-y-2">
          {members.map(member => (
            <div key={member._id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {member.profileImage && (
                  <img 
                    src={member.profileImage} 
                    alt={member.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  member.role === 'admin' 
                    ? 'bg-indigo-100 text-indigo-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.role.toUpperCase()}
                </span>
                {member.role !== 'admin' && (
                  <button
                    onClick={() => handleRemoveMember(member._id)}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamManagementPage;
```

### 7. Accept Invitation Page

Create `FrontEnd/src/pages/AcceptInvitationPage.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { invitationService } from '../services/invitationService';
import toast from 'react-hot-toast';

const AcceptInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      const data = await invitationService.getInvitationByToken(token);
      setInvitation(data);
    } catch (error) {
      toast.error('Invalid or expired invitation');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!isSignedIn) {
      // Redirect to sign in, then come back here
      navigate(`/login?redirect=/accept-invitation?token=${token}`);
      return;
    }

    setAccepting(true);
    try {
      const authToken = await getToken();
      await invitationService.acceptInvitation(token, authToken);
      toast.success('Welcome to the team!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">Team Invitation</h1>
        
        {invitation && (
          <>
            <div className="mb-6">
              <p className="text-gray-600 mb-2">You've been invited to join:</p>
              <p className="text-xl font-semibold">{invitation.teamId?.name}</p>
              <p className="text-sm text-gray-500 mt-2">
                Invited by: {invitation.invitedBy?.name}
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                As a developer, you'll have read-only access to team repositories and reviews.
              </p>
            </div>
            
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {accepting ? 'Accepting...' : isSignedIn ? 'Accept Invitation' : 'Sign In to Accept'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitationPage;
```

### 8. Update App Routes

In `FrontEnd/src/App.tsx`, add the new routes:

```typescript
import TeamManagementPage from './pages/TeamManagementPage';
import AcceptInvitationPage from './pages/AcceptInvitationPage';

// Inside Routes:
<Route path="/team" element={<ProtectedRoute><AdminOnly><TeamManagementPage /></AdminOnly></ProtectedRoute>} />
<Route path="/accept-invitation" element={<AcceptInvitationPage />} />
```

### 9. Update User Interface Types

Update `FrontEnd/src/types/user.ts` or wherever you define types:

```typescript
export interface User {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  profileImage?: string;
  role: 'admin' | 'developer';  // Remove 'viewer'
  teamId?: string;
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
  };
}

export interface Team {
  _id: string;
  name: string;
  adminId: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  _id: string;
  teamId: string | { _id: string; name: string };
  invitedBy: string | { _id: string; name: string; email: string };
  email: string;
  role: 'developer';
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
}
```

## That's it!

Follow these examples to implement the remaining frontend RBAC functionality. All backend routes are secured and ready to use.
