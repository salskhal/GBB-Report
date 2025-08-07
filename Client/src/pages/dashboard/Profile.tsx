import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile, useChangePassword } from '@/hooks/useProfile';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, User, Mail, Building, Calendar, Shield } from 'lucide-react';

interface PasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const Profile = () => {
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch user profile using custom hook
  const { data: profile, isLoading, error } = useProfile();

  // Password change mutation using custom hook
  const changePasswordMutation = useChangePassword();

  // Password change form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  const onSubmit = (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      alert('New password and confirmation do not match');
      return;
    }
    
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        alert('Password changed successfully!');
        reset();
        setIsChangingPassword(false);
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || 'Failed to change password');
      },
    });
  };

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profile</h1>
      </div>

      {/* Profile Information */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Profile Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <Label className="text-sm font-medium text-gray-500">Name</Label>
                <p className="text-lg">{profile?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <Label className="text-sm font-medium text-gray-500">Username</Label>
                <p className="text-lg">{profile?.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <Label className="text-sm font-medium text-gray-500">Contact Email</Label>
                <p className="text-lg">{profile?.contactEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-500" />
              <div>
                <Label className="text-sm font-medium text-gray-500">Role</Label>
                <p className="text-lg capitalize">{profile?.role}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-gray-500" />
              <div>
                <Label className="text-sm font-medium text-gray-500">MDA</Label>
                <p className="text-lg">{profile?.mda?.name || profile?.mdaReference}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <Label className="text-sm font-medium text-gray-500">Last Login</Label>
                <p className="text-lg">
                  {profile?.lastLogin 
                    ? new Date(profile.lastLogin).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <Label className="text-sm font-medium text-gray-500">Member Since</Label>
                <p className="text-lg">
                  {new Date(profile?.createdAt || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Password Change Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Security</h2>
          </div>
          {!isChangingPassword && (
            <Button onClick={() => setIsChangingPassword(true)}>
              Change Password
            </Button>
          )}
        </div>

        {isChangingPassword ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showPasswords.old ? 'text' : 'password'}
                    {...register('oldPassword', {
                      required: 'Current password is required',
                    })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('old')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPasswords.old ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.oldPassword && (
                  <p className="text-sm text-red-600">{errors.oldPassword.message}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    {...register('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-600">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: 'Please confirm your new password',
                      validate: (value) =>
                        value === newPassword || 'Passwords do not match',
                    })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsChangingPassword(false);
                  reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-gray-600">
            <p>Click "Change Password" to update your password.</p>
            <p className="text-sm mt-2">
              You'll need to provide your current password to make changes.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};