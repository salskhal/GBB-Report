import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { adminService } from '@/services/adminService';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, X, Shield } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export const ResetPasswordModal = ({
  isOpen,
  onClose,
  userId,
  userName,
}: ResetPasswordModalProps) => {
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  const resetPasswordMutation = useMutation({
    mutationFn: (newPassword: string) =>
      adminService.resetUserPassword(userId, newPassword),
    onSuccess: () => {
      alert(`Password reset successfully for ${userName}!`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      handleClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to reset password');
    },
  });

  const onSubmit = (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      alert('New password and confirmation do not match');
      return;
    }
    resetPasswordMutation.mutate(data.newPassword);
  };

  const handleClose = () => {
    reset();
    setShowPasswords({ new: false, confirm: false });
    onClose();
  };

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Reset Password</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600">
            Reset password for: <span className="font-semibold">{userName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                placeholder="Enter new password"
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Please confirm the new password',
                  validate: (value) =>
                    value === newPassword || 'Passwords do not match',
                })}
                className="pr-10"
                placeholder="Confirm new password"
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

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="flex-1"
            >
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> The user will need to use this new password to log in.
            Consider sharing it securely with them.
          </p>
        </div>
      </Card>
    </div>
  );
};