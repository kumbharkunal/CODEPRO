import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { invitationService } from '../services/invitationService';
import { Invitation } from '../types';
import toast from 'react-hot-toast';
import { Mail, Users, CheckCircle } from 'lucide-react';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';

const AcceptInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const dispatch = useAppDispatch();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid invitation link');
      navigate('/');
      return;
    }
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    if (!token) return;

    try {
      const data = await invitationService.getInvitationByToken(token);
      setInvitation(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid or expired invitation');
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;

    if (!isSignedIn) {
      // Redirect to sign in, then come back here
      toast('Please sign in to accept the invitation', { icon: 'ℹ️' });
      const redirectUrl = encodeURIComponent(`/accept-invitation?token=${token}`);
      navigate(`/login?redirect=${redirectUrl}`);
      return;
    }

    setAccepting(true);
    try {
      const response = await invitationService.acceptInvitation(token);

      // Immediately update Redux with the role from the backend response
      const authToken = await getToken({ skipCache: true });
      if (authToken && response.user) {
        // Update Redux immediately with the correct role
        dispatch(setCredentials({
          user: {
            id: response.user.id,
            clerkId: (response.user as any).clerkId || response.user.id, // Fallback if clerkId is missing in response
            email: response.user.email,
            name: response.user.name,
            role: response.user.role as any, // This should be 'developer' now
            profileImage: clerkUser?.imageUrl,
          },
          token: authToken,
        }));
      }

      toast.success('Welcome to the team!');
      // Give a bit more time for state to settle
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-900 dark:text-gray-100">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Invalid Invitation</h1>
          <p className="text-gray-600 dark:text-gray-400">This invitation link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const teamName = typeof invitation.teamId === 'object' ? invitation.teamId.name : 'the team';
  const invitedByName = typeof invitation.invitedBy === 'object' ? invitation.invitedBy.name : 'Someone';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Team Invitation</h1>
          <p className="text-gray-600 dark:text-gray-400">You've been invited to join a team</p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Team</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{teamName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Invited by</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{invitedByName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your email</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{invitation.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>As a developer,</strong> you'll have read-only access to team repositories and reviews.
            You can view all PRs and AI analysis, but won't be able to make changes.
          </p>
        </div>

        {!isSignedIn && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> You must sign in or sign up using <strong>{invitation.email}</strong> to accept this invitation.
            </p>
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
        >
          {accepting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Accepting...
            </>
          ) : isSignedIn ? (
            'Accept Invitation'
          ) : (
            'Sign In to Accept'
          )}
        </button>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default AcceptInvitationPage;
