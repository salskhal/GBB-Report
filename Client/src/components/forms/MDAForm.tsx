import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
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
import { useCreateMDA, useUpdateMDA } from '@/hooks/useMDAs';
import type { MDA, CreateMDARequest, UpdateMDARequest } from '@/services/adminService';

interface MDAFormProps {
  mode: 'create' | 'update';
  mda?: MDA | null;
}

export default function MDAForm({ mode, mda }: MDAFormProps) {
  const navigate = useNavigate();
  const createMDAMutation = useCreateMDA();
  const updateMDAMutation = useUpdateMDA();
  const [submitError, setSubmitError] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateMDARequest | UpdateMDARequest>({
    defaultValues: {
      name: '',
      reports: [{ title: '', url: '', isActive: true }],
      ...(mode === 'update' && { isActive: true })
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'reports'
  });

  // Reset form when MDA changes or mode changes
  useEffect(() => {
    if (mode === 'update' && mda) {
      reset();
      setValue('name', mda.name);
      if ('isActive' in mda) {
        setValue('isActive', mda.isActive);
      }
      
      // Handle reports array - ensure at least one report exists
      const reportsToSet = mda.reports && mda.reports.length > 0 
        ? mda.reports 
        : [{ title: '', url: '', isActive: true }];
      
      replace(reportsToSet);
    } else if (mode === 'create') {
      reset({
        name: '',
        reports: [{ title: '', url: '', isActive: true }]
      });
    }
  }, [mode, mda, reset, setValue, replace]);

  const onSubmit = async (data: CreateMDARequest | UpdateMDARequest) => {
    try {
      setSubmitError('');
      
      if (mode === 'create') {
        await createMDAMutation.mutateAsync(data as CreateMDARequest);
      } else if (mode === 'update' && mda) {
        await updateMDAMutation.mutateAsync({ 
          id: mda._id, 
          mdaData: data as UpdateMDARequest 
        });
      }
      
      navigate('/admin/dashboard/mdas');
    } catch (error: unknown) {
      console.error(`Failed to ${mode} MDA:`, error);
      
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
          // Handle business logic errors
          else if (errorData.message) {
            setSubmitError(errorData.message);
          }
          else {
            setSubmitError(`Failed to ${mode} MDA. Please try again.`);
          }
        } else {
          setSubmitError(`Failed to ${mode} MDA. Please try again.`);
        }
      } else {
        setSubmitError(`Failed to ${mode} MDA. Please try again.`);
      }
    }
  };

  const addReport = () => {
    append({ title: '', url: '', isActive: true });
  };

  const removeReport = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const isLoading = isSubmitting || createMDAMutation.isPending || updateMDAMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/dashboard/mdas')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to MDAs
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New MDA' : `Update ${mda?.name || 'MDA'}`}
          </h1>
          <p className="text-gray-600 mt-1">
            {mode === 'create' 
              ? 'Add a new Ministry, Department, or Agency to the system'
              : 'Update the MDA information and reports'
            }
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">MDA Name</Label>
            <Input
              id="name"
              {...register('name', { required: 'MDA name is required' })}
              placeholder="e.g., Ministry of Health"
              className="mt-1"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Reports</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addReport}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Add Report
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Report {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeReport(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`reports.${index}.title`}>Report Title</Label>
                    <Input
                      id={`reports.${index}.title`}
                      {...register(`reports.${index}.title`, { 
                        required: 'Report title is required' 
                      })}
                      placeholder="e.g., Monthly Health Report"
                      className="mt-1"
                    />
                    {errors.reports?.[index]?.title && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.reports[index]?.title?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`reports.${index}.url`}>Report URL</Label>
                    <Input
                      id={`reports.${index}.url`}
                      {...register(`reports.${index}.url`, { 
                        required: 'Report URL is required',
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message: 'Please provide a valid URL (must start with http:// or https://)'
                        }
                      })}
                      placeholder="e.g., https://example.com/reports"
                      className="mt-1"
                    />
                    {errors.reports?.[index]?.url && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.reports[index]?.url?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor={`reports.${index}.isActive`}>Report Status</Label>
                  <Select 
                    onValueChange={(value) => setValue(`reports.${index}.isActive`, value === 'true')} 
                    defaultValue={field.isActive?.toString() || 'true'}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          {mode === 'update' && (
            <div>
              <Label htmlFor="isActive">MDA Status</Label>
              <Select 
                onValueChange={(value) => setValue('isActive', value === 'true')} 
                defaultValue={mda?.isActive?.toString() || 'true'}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/dashboard/mdas')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading 
                ? `${mode === 'create' ? 'Creating' : 'Updating'}...` 
                : `${mode === 'create' ? 'Create' : 'Update'} MDA`
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}