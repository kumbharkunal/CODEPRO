import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Users, Shield, Code, Eye, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer';
  profileImage?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'developer' | 'viewer') => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          icon: <Crown className="w-4 h-4" />,
          label: 'Admin',
          color: 'bg-purple-500 text-white',
          description: 'Full access - manage repos, reviews, and team'
        };
      case 'developer':
        return {
          icon: <Code className="w-4 h-4" />,
          label: 'Developer',
          color: 'bg-blue-500 text-white',
          description: 'View reviews and repositories'
        };
      default:
        return {
          icon: <Eye className="w-4 h-4" />,
          label: 'Viewer',
          color: 'bg-gray-500 text-white',
          description: 'Read-only access'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-medium animate-pulse">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 sm:p-8 lg:p-10 text-primary-foreground shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
          
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Users className="w-6 h-6" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Team Management</h1>
              </div>
              <p className="text-primary-foreground/80 text-sm sm:text-base">
                Manage your team members and their access levels
              </p>
            </div>
            <Badge className="bg-white text-primary font-semibold px-4 py-2">
              {users.length} {users.length === 1 ? 'Member' : 'Members'}
            </Badge>
          </div>
        </div>

        {/* Users List */}
        <div className="grid gap-4 sm:gap-6">
          {users.map((user) => {
            const roleConfig = getRoleConfig(user.role);
            return (
              <Card key={user._id} className="group relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <CardHeader className="relative">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-16 w-16 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={user.name} className="rounded-full" />
                        ) : (
                          <span className="text-2xl font-bold text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </Avatar>
                      
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-xl line-clamp-1">{user.name}</CardTitle>
                        <CardDescription className="text-sm line-clamp-1">{user.email}</CardDescription>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <Badge className={`${roleConfig.color} flex items-center gap-2`}>
                        {roleConfig.icon}
                        {roleConfig.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative space-y-4">
                  <div className="bg-secondary/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">{roleConfig.description}</p>
                  </div>

                  {/* Role Change Actions */}
                  <div className="flex flex-wrap gap-2">
                    {user.role !== 'admin' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateUserRole(user._id, 'admin')}
                        className="hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/50"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Make Admin
                      </Button>
                    )}
                    {user.role !== 'developer' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateUserRole(user._id, 'developer')}
                        className="hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/50"
                      >
                        <Code className="w-4 h-4 mr-2" />
                        Make Developer
                      </Button>
                    )}
                    {user.role !== 'viewer' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateUserRole(user._id, 'viewer')}
                        className="hover:bg-gray-500/10 hover:text-gray-600 hover:border-gray-500/50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Make Viewer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="border-2 border-dashed">
          <CardContent className="py-8 text-center space-y-3">
            <Shield className="w-12 h-12 mx-auto text-primary/50" />
            <div className="space-y-2">
              <p className="font-semibold">Role Permissions</p>
              <div className="text-sm text-muted-foreground space-y-1 max-w-2xl mx-auto">
                <p><strong>Admin:</strong> Full access to connect/disconnect repos, delete reviews, and manage team members</p>
                <p><strong>Developer:</strong> View-only access to repositories and reviews</p>
                <p><strong>Viewer:</strong> Read-only access (reserved for future use)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
