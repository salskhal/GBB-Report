import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateUser } from '@/hooks/useUsers';
import { useMDAs } from '@/hooks/useMDAs';
import type { AdminUser, UpdateUserRequest } from '@/services/adminService';

interface UpdateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
}

export default function UpdateUserModal({ isOpen, onClose, user }: UpdateUserModalProps) {
  const { data: mdas = [] } = useMDAs();
  const updateUserMutation = useUpdateUser();
  const [submitError, setSubmitError] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserRequest>();

  // Reset form when user changes or modal opens
  useEffect(() => {
    if (isOpen && user) {
      reset();
      setValue('name', user.name);
      setValue('email', user.email);
      setValue('mdaId', user.mdaId._id);
      setValue('isActive', user.isActive);
    }
  }, [isOpen, user, reset, setValue]);

  const onSubmit = async (data: UpdateUserRequest) => {
    if (!user) return;

    try {
      setSubmitError('');
      await updateUserMutation.mutateAsync({ id: user._id, userData: data });
      reset();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to update user:', error);
      
      // Handle different error types from the server
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data: any } };
        const errorData = axiosError.response?.data;
        
        if (errorData) {
          // Handle express-validator errors
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const validationErrors = errorData.errors.map((err: any) => err.msg).join(', ');
            setSubmitError(`Validation failed: ${validationErrors}`);
          }
          // Handle mongoose validation errors
          // else if (errorData.errors && Array.isArray(errorData.errors)) {
          //   setSubmitError(`Validation error: ${errorData.errors.join(', ')}`);
          // }
          // Handle business logic errors
          else if (errorData.message) {
            setSubmitError(errorData.message);
          }
          else {
            setSubmitError('Failed to update user. Please try again.');
          }
        } else {
          setSubmitError('Failed to update user. Please try again.');
        }
      } else {
        setSubmitError('Failed to update user. Please try again.');
      }
    }
  };

  const handleClose = () => {
    reset();
    setSubmitError('');
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Update User</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="e.g., John Doe"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="mdaId">MDA</Label>
            <Select onValueChange={(value) => setValue('mdaId', value)} defaultValue={user.mdaId._id}>
              <SelectTrigger>
                <SelectValue placeholder="Select an MDA" />
              </SelectTrigger>
              <SelectContent>
                {mdas.map((mda) => (
                  <SelectItem key={mda._id} value={mda._id}>
                    {mda.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.mdaId && (
              <p className="text-sm text-red-500 mt-1">{errors.mdaId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="isActive">Status</Label>
            <Select onValueChange={(value) => setValue('isActive', value === 'true')} defaultValue={user.isActive.toString()}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || updateUserMutation.isPending}
            >
              {isSubmitting || updateUserMutation.isPending ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}