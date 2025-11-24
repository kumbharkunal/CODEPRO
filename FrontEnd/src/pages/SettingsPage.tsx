import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { stripeService } from '@/services/stripeService';
import { useUser, useAuth } from '@clerk/clerk-react';

import { useRole } from '@/hooks/useRole';
import { useUpdateUser, useUploadProfileImage, useSyncClerkUser } from '@/hooks/useUser';
import {
  Upload,
  CreditCard,
  User,
  Mail,
  Shield,
  Check,
  Crown,
  Sparkles,
  Camera,
  RefreshCw,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';


export default function SettingsPage() {
  const user = useAppSelector(state => state.auth.user);
  const dispatch = useAppDispatch();
  const { user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const { isAdmin, isDeveloper } = useRole();

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [imagePreview, setImagePreview] = useState(user?.profileImage || '');

  // Track original values for comparison
  const [originalName, setOriginalName] = useState(user?.name || '');
  const [originalImage, setOriginalImage] = useState(user?.profileImage || '');

  // Track pending changes
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [hasImageChanged, setHasImageChanged] = useState(false);

  // Loading states
  const [updating, setUpdating] = useState(false);

  // Initialize form values when user data becomes available
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setImagePreview(user.profileImage || '');
      setOriginalName(user.name || '');
      setOriginalImage(user.profileImage || '');
    }
  }, [user?.id]); // Only re-run if user ID changes (new user logged in)

  // REMOVED: The problematic useEffect that synced from Clerk
  // This was overwriting MongoDB data with stale Clerk imageUrl
  // Now we only sync FROM MongoDB TO Clerk, not the reverse



  const { mutateAsync: uploadImage } = useUploadProfileImage();
  const { mutateAsync: updateUser } = useUpdateUser();
  const { mutate: syncUser, isPending: refreshingSubscription } = useSyncClerkUser();

  // ... (keep useEffects)

  // Manual refresh function for subscription data
  const handleRefreshSubscription = async () => {
    if (!clerkUser) return;

    try {
      const token = await getToken({ skipCache: true });
      if (!token) return;

      syncUser({ clerkUser, token });
    } catch (error) {
      console.error('Error getting token:', error);
    }
  };

  // Stage image when dropped - upload happens on Save
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;

    const file = acceptedFiles[0];

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Stage the file for upload
    setPendingImageFile(file);
    setHasImageChanged(true);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    toast.success('Image ready to save. Click "Save Changes" to update.');
  }, []);

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
    let updatedImageUrl: string = user!.profileImage || '';

    try {
      // Step 1: Upload image if changed
      if (hasImageChanged && pendingImageFile) {
        console.log('Uploading new profile image...');
        try {
          const imageResponse = await uploadImage({ userId: user!.id, file: pendingImageFile });
          updatedImageUrl = imageResponse.imageUrl;
          console.log('Image uploaded:', updatedImageUrl);
        } catch (imageError: any) {
          console.error('Image upload failed:', imageError);
          throw new Error('Failed to upload profile image');
        }
      }

      // Step 2: Update name if changed
      const hasNameChanged = name.trim() !== originalName;
      if (hasNameChanged) {
        console.log('Updating profile name...');
        try {
          await updateUser({ userId: user!.id, data: { name: name.trim() } });
          console.log('Name updated');
        } catch (nameError: any) {
          console.error('Name update failed:', nameError);
          throw new Error('Failed to update name');
        }
      }

      // Step 3: Update Redux state with all changes
      const updatedUser = {
        ...user!,
        name: name.trim(),
        profileImage: updatedImageUrl,
      };

      dispatch(setCredentials({
        user: updatedUser,
        token: localStorage.getItem('token') || '',
      }));

      // Step 4: Update original values and reset form state
      setOriginalName(name.trim());
      setOriginalImage(updatedImageUrl);
      setPendingImageFile(null);
      setHasImageChanged(false);

      toast.success('Profile updated successfully!');

    } catch (error: any) {
      console.error('Profile update error:', error);

      // Show specific error message
      const errorMessage = error.message || error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);

      // Revert preview to original on error
      setImagePreview(originalImage);
      setName(originalName);
      setPendingImageFile(null);
      setHasImageChanged(false);
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Get current plan - default to 'free' if not set
  const currentPlan = user.subscription?.plan || 'free';

  const planColor = currentPlan === 'pro' ? 'text-yellow-500' :
    currentPlan === 'enterprise' ? 'text-purple-500' :
      'text-muted-foreground';

  const planIcon = currentPlan === 'pro' || currentPlan === 'enterprise' ?
    <Crown className="w-4 h-4" /> : null;

  // Check if user has Pro or Enterprise subscription
  const hasProOrEnterprise = currentPlan === 'pro' || currentPlan === 'enterprise';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your account and preferences
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
              {planIcon && <span className={planColor}>{planIcon}</span>}
              <span className={`font-medium capitalize ${planColor}`}>
                {currentPlan === 'pro' ? 'Pro' : currentPlan === 'enterprise' ? 'Enterprise' : 'Free'} Plan
              </span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid h-auto p-1">
              <TabsTrigger
                value="profile"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger
                value="subscription"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2.5"
              >
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Subscription</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details and profile picture
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-8">
                {/* Profile Image Section */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    Profile Photo
                  </Label>

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Avatar Display */}
                    <div className="relative group">
                      <Avatar className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40">
                        <AvatarImage src={imagePreview} />
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                          {name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {hasImageChanged && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Upload Area */}
                    <div
                      {...getRootProps()}
                      className={`
                        flex-1                        border-2 border-dashed rounded-xl p-6 sm:p-8
                        transition-all duration-300
                        cursor-pointer hover:scale-[1.02]
                        ${isDragActive
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
                        }
                        ${updating ? 'opacity-50 pointer-events-none' : ''}
                      `}
                    >
                      <input {...getInputProps()} />
                      <div className="text-center space-y-3">
                        <div className="flex justify-center">
                          <div className={`
                            p-3 rounded-full transition-colors duration-300
                            ${isDragActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                          `}>
                            <Upload className="w-6 h-6" />
                          </div>
                        </div>

                        {updating ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Preparing...</p>
                          </div>
                        ) : isDragActive ? (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-primary">Drop your photo here</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              <span className="text-primary">Click to upload</span> or drag & drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Name Input */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Display Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 text-base border-2 focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Email Display */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="h-12 text-base bg-muted/50 border-2"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Check className="w-3 h-3" />
                    Managed by authentication provider
                  </p>
                </div>

                <Separator />

                {/* Action Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={updating || !name.trim() || (name.trim() === originalName && !hasImageChanged)}
                    size="lg"
                    className="min-w-[140px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {updating ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Save Changes
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
                <CardHeader className="p-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Subscription & Billing
                      </CardTitle>
                      <CardDescription className="text-base">
                        Manage your subscription plan and billing information
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleRefreshSubscription}
                      disabled={refreshingSubscription}
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshingSubscription ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Current Plan Card */}
                <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-md hover:shadow-lg transition-all duration-300">
                  {hasProOrEnterprise && (
                    <div className="absolute top-4 right-4">
                      <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {planIcon && (
                            <div className={`p-2 rounded-lg ${currentPlan === 'enterprise' ? 'bg-purple-500/10' :
                              currentPlan === 'pro' ? 'bg-yellow-500/10' :
                                'bg-muted'
                              }`}>
                              <span className={planColor}>{planIcon}</span>
                            </div>
                          )}
                          <div>
                            <h3 className="text-2xl font-bold capitalize">
                              {currentPlan === 'pro' ? 'Pro' : currentPlan === 'enterprise' ? 'Enterprise' : 'Free'} Plan
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Status: <span className="font-medium text-foreground capitalize">
                                {user.subscription?.status || 'Active'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {isAdmin && (
                        <Button
                          onClick={handleManageSubscription}
                          variant="default"
                          size="lg"
                          className="w-full sm:w-auto h-12 font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Manage Billing
                        </Button>
                      )}
                      {isDeveloper && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-800">
                          <Lock className="w-4 h-4" />
                          <span className="text-sm font-medium">Contact admin for billing</span>
                        </div>
                      )}
                    </div>

                    {/* Plan Features */}
                    <Separator />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                        <div className="p-1.5 rounded-full bg-primary/10 mt-0.5">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">AI Code Reviews</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {currentPlan === 'free' ? '60 reviews/month' :
                              currentPlan === 'pro' ? '300 reviews/month' : 'Unlimited'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                        <div className="p-1.5 rounded-full bg-primary/10 mt-0.5">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Repository Access</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {currentPlan === 'free' ? '1 repository' :
                              currentPlan === 'pro' ? 'Up to 5 repositories' : 'Unlimited repositories'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upgrade CTA - Only show if user is on Free plan */}
                {currentPlan === 'free' && (
                  <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 sm:p-8">
                    <div className="relative z-10 text-center space-y-4">
                      <div className="inline-flex p-3 rounded-full bg-primary/10">
                        <Crown className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
                        <p className="text-muted-foreground">
                          Unlock unlimited reviews, priority support, and advanced features
                        </p>
                      </div>
                      <Button
                        size="lg"
                        className="font-semibold shadow-lg hover:shadow-xl transition-all"
                        onClick={() => window.location.href = '/pricing'}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        View Plans
                      </Button>
                    </div>
                  </div>
                )}

                {/* Pro/Enterprise Plan Benefits - Show if user has Pro or Enterprise */}
                {hasProOrEnterprise && (
                  <div className="relative overflow-hidden rounded-xl border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 via-green-500/10 to-green-500/5 p-6 sm:p-8">
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-green-500/10">
                          <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
                            {currentPlan === 'pro' ? 'Pro' : 'Enterprise'} Features Active
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            You're enjoying all {currentPlan === 'pro' ? 'Pro' : 'Enterprise'} benefits
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5">
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium">Unlimited Reviews</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5">
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium">Priority Support</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5">
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium">Advanced AI Analysis</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}