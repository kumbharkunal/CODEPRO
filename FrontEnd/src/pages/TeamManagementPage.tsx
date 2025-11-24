import { useState, useEffect } from 'react';
import { teamService } from '../services/teamService';
import { invitationService } from '../services/invitationService';
import { useRBAC } from '../hooks/useRBAC';
import { Team, User, Invitation } from '../types';
import toast from 'react-hot-toast';
import { Users, Mail, UserX, Copy, Trash2 } from 'lucide-react';

const TeamManagementPage = () => {
  // const { getToken } = useAuth();
  const { isAdmin } = useRBAC();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadTeamData();
    }
  }, [isAdmin]);

  const loadTeamData = async () => {
    try {
      setLoadingData(true);
      const [teamData, membersData, invitationsData] = await Promise.all([
        teamService.getMyTeam(),
        teamService.getTeamMembers(),
        invitationService.getTeamInvitations(),
      ]);
      setTeam(teamData);
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load team data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setLoading(true);
    try {
      const result = await invitationService.createInvitation(inviteEmail);
      toast.success(`Invitation sent to ${inviteEmail}`);

      // Copy invitation link to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(result.invitationLink);
        toast.success('Invitation link copied to clipboard');
      }

      setInviteEmail('');
      await loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Revoke this invitation?')) return;

    try {
      await invitationService.revokeInvitation(invitationId);
      toast.success('Invitation revoked');
      await loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revoke invitation');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the team?`)) return;

    try {
      await teamService.removeMember(memberId);
      toast.success('Member removed');
      await loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const copyInvitationLink = async (token: string) => {
    const link = `${window.location.origin}/accept-invitation?token=${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Invitation link copied');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Team</h1>
        <p className="text-gray-600 dark:text-gray-400">Only team admins can manage team settings.</p>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-900 dark:text-gray-100">Loading team data...</p>
        </div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Team Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your team members and invitations</p>
      </div>

      {/* Team Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Information
        </h2>
        <p className="text-lg text-gray-900 dark:text-gray-100">{team?.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Invite Member */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Invite Developer
        </h2>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="developer@example.com"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Pending Invitations ({pendingInvitations.length})
          </h2>
          <div className="space-y-2">
            {pendingInvitations.map(invitation => (
              <div key={invitation._id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{invitation.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyInvitationLink(invitation.token)}
                    className="px-3 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded flex items-center gap-1 transition-colors"
                    title="Copy invitation link"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </button>
                  <button
                    onClick={() => handleRevokeInvitation(invitation._id)}
                    className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Team Members ({members.length})
        </h2>
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                {member.profileImage ? (
                  <img
                    src={member.profileImage}
                    alt={member.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <span className="text-indigo-600 dark:text-indigo-300 font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${member.role === 'admin'
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                  {member.role.toUpperCase()}
                </span>
                {member.role !== 'admin' && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-1 transition-colors"
                    title="Remove member"
                  >
                    <UserX className="w-4 h-4" />
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
