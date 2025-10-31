import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { stripeService } from '@/services/stripeService';
import { Upload, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/services/api';

export default function SettingsPage() {
  const user = useAppSelector(state => state.auth.user);
  const dispatch = useAppDispatch();
  const [name, setName] = useState(user?.name || '');
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Image upload with react-dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    const file = acceptedFiles[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', user!.id);

      const response = await api.post('/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update Redux state
      dispatch(setCredentials({
        user: {
          ...user!,
          profileImage: response.data.imageUrl,
        },
        token: localStorage.getItem('token') || '',
      }));

      toast.success('Profile image updated!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  }, [user, dispatch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setUpdating(true);

    try {
      await api.put(`/users/${user!.id}`, { name });

      dispatch(setCredentials({
        user: { ...user!, name },
        token: localStorage.getItem('token') || '',
      }));

      toast.success('Profile updated!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { url } = await stripeService.createCustomerPortal(user!.id);
      window.location.href = url;
    } catch (error) {
      toast.error('Failed to open subscription management');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Image */}
          <div className="space-y-2">
            <Label>Profile Image</Label>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.profileImage} />
                <AvatarFallback className="text-2xl">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div
                {...getRootProps()}
                className={`
                  flex-1 border-2 border-dashed rounded-lg p-6 cursor-pointer
                  hover:border-primary transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted'}
                `}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  {uploading ? (
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  ) : isDragActive ? (
                    <p className="text-sm text-muted-foreground">Drop image here</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Drag & drop or click to upload
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled />
            <p className="text-xs text-muted-foreground">
              Email managed by authentication provider
            </p>
          </div>

          <Button onClick={handleUpdateProfile} disabled={updating}>
            {updating ? 'Updating...' : 'Update Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium capitalize">{user.subscription?.plan || 'Free'} Plan</p>
              <p className="text-sm text-muted-foreground">
                {user.subscription?.status || 'Active'}
              </p>
            </div>
            <Button onClick={handleManageSubscription} variant="outline">
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}