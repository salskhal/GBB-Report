import { useState } from "react";
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
import { useCreateAdmin } from "@/hooks/useAdmins";
import type { CreateAdminRequest } from "@/services/adminService";

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateAdminModal({
  isOpen,
  onClose,
}: CreateAdminModalProps) {
  const createAdminMutation = useCreateAdmin();
  const [submitError, setSubmitError] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAdminRequest>({
    defaultValues: {
      role: 'admin'
    }
  });

  const onSubmit = async (data: CreateAdminRequest) => {
    try {
      setSubmitError("");
      await createAdminMutation.mutateAsync(data);
      reset();
      onClose();
    } catch (error: unknown) {
      console.error("Failed to create admin:", error);

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
            setSubmitError("Failed to create admin. Please try again.");
          }
        } else {
          setSubmitError("Failed to create admin. Please try again.");
        }
      } else {
        setSubmitError("Failed to create admin. Please try again.");
      }
    }
  };

  const handleClose = () => {
    reset();
    setSubmitError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Create New Admin</h2>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                },
              })}
              placeholder="Strong password required"
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              defaultValue="admin"
              onValueChange={(value: 'admin' | 'superadmin') => setValue("role", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
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

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createAdminMutation.isPending}
            >
              {isSubmitting || createAdminMutation.isPending
                ? "Creating..."
                : "Create Admin"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}