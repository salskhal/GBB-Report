import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateAdmin } from "@/hooks/useAdmins";
import type { UpdateAdminRequest, Admin } from "@/services/adminService";

interface UpdateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: Admin | null;
}

interface UpdateAdminFormData {
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
  isActive: boolean;
}

export default function UpdateAdminModal({
  isOpen,
  onClose,
  admin,
}: UpdateAdminModalProps) {
  const updateAdminMutation = useUpdateAdmin();
  const [submitError, setSubmitError] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateAdminFormData>();

  // Reset form when admin changes
  useEffect(() => {
    if (admin) {
      setValue("name", admin.name);
      setValue("email", admin.email);
      setValue("role", admin.role);
      setValue("isActive", admin.isActive);
    }
  }, [admin, setValue]);

  const onSubmit = async (data: UpdateAdminFormData) => {
    if (!admin) return;

    try {
      setSubmitError("");
      
      // Only send changed fields
      const updateData: UpdateAdminRequest = {};
      if (data.name !== admin.name) updateData.name = data.name;
      if (data.email !== admin.email) updateData.email = data.email;
      if (data.role !== admin.role) updateData.role = data.role;
      if (data.isActive !== admin.isActive) updateData.isActive = data.isActive;

      await updateAdminMutation.mutateAsync({
        id: admin._id,
        adminData: updateData,
      });
      
      reset();
      onClose();
    } catch (error: unknown) {
      console.error("Failed to update admin:", error);

      // Handle different error types from the server
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response: { data: any } };
        const errorData = axiosError.response?.data;

        if (errorData) {
          // Handle express-validator errors
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const validationErrors = errorData.errors
              .map((err: any) => err.msg)
              .join(", ");
            setSubmitError(`Validation failed: ${validationErrors}`);
          }
          // Handle business logic errors
          else if (errorData.message) {
            setSubmitError(errorData.message);
          } else {
            setSubmitError("Failed to update admin. Please try again.");
          }
        } else {
          setSubmitError("Failed to update admin. Please try again.");
        }
      } else {
        setSubmitError("Failed to update admin. Please try again.");
      }
    }
  };

  const handleClose = () => {
    reset();
    setSubmitError("");
    onClose();
  };

  if (!isOpen || !admin) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Update Admin</h2>
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
              {...register("name", { required: "Name is required" })}
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
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
              placeholder="e.g., admin@ministry.gov"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={admin.role}
              onValueChange={(value: 'admin' | 'superadmin') => setValue("role", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500 mt-1">
                {errors.role.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Super admins can manage other admins and view activity logs
            </p>
          </div>

          <div>
            <Label htmlFor="isActive">Status</Label>
            <Select
              value={admin.isActive ? "active" : "inactive"}
              onValueChange={(value) => setValue("isActive", value === "active")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Inactive admins cannot log in to the system
            </p>
          </div>

          {!admin.canBeDeleted && (
            <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded">
              <p className="text-sm">
                This is a protected super admin account that cannot be deleted.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || updateAdminMutation.isPending}
            >
              {isSubmitting || updateAdminMutation.isPending
                ? "Updating..."
                : "Update Admin"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}