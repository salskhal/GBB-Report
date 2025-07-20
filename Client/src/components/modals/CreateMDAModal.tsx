
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateMDA } from '@/hooks/useMDAs';
import type { CreateMDARequest } from '@/services/adminService';

interface CreateMDAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateMDAModal({ isOpen, onClose }: CreateMDAModalProps) {
  const createMDAMutation = useCreateMDA();
  const [submitError, setSubmitError] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMDARequest>();

  const onSubmit = async (data: CreateMDARequest) => {
    try {
      setSubmitError('');
      await createMDAMutation.mutateAsync(data);
      reset();
      onClose();
    } catch (error: unknown) {
      console.error('Failed to create MDA:', error);
      
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
            setSubmitError('Failed to create MDA. Please try again.');
          }
        } else {
          setSubmitError('Failed to create MDA. Please try again.');
        }
      } else {
        setSubmitError('Failed to create MDA. Please try again.');
      }
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Create New MDA</h2>
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
            <Label htmlFor="name">MDA Name</Label>
            <Input
              id="name"
              {...register('name', { required: 'MDA name is required' })}
              placeholder="e.g., Ministry of Health"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="reportUrl">Report URL</Label>
            <Input
              id="reportUrl"
              {...register('reportUrl', { 
                required: 'Report URL is required',
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please provide a valid URL (must start with http:// or https://)'
                }
              })}
              placeholder="e.g., https://example.com/reports"
            />
            {errors.reportUrl && (
              <p className="text-sm text-red-500 mt-1">{errors.reportUrl.message}</p>
            )}
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
              disabled={isSubmitting || createMDAMutation.isPending}
            >
              {isSubmitting || createMDAMutation.isPending ? 'Creating...' : 'Create MDA'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}