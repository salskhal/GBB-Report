import { cn } from "@/lib/utils";
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
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { useState } from "react";

interface LoginFormData {
  email: string;
  password: string;
  mdaId: string;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string>("");

  // Fetch MDAs from backend
  const { data: mdas, isLoading: mdaLoading } = useQuery({
    queryKey: ['mdas'],
    queryFn: authService.getMDAs,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginError("");
      const success = await login(data.email, data.password, data.mdaId);

      if (success) {
        navigate("/dashboard");
      } else {
        setLoginError("Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError("Login failed. Please check your credentials and try again.");
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      
      {loginError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {loginError}
        </div>
      )}

      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="mdaId">MDA</Label>
          <Select 
            required 
            onValueChange={(value) => setValue("mdaId", value)}
            disabled={mdaLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={mdaLoading ? "Loading MDAs..." : "Select an MDA"} />
            </SelectTrigger>
            <SelectContent>
              {mdas?.map((mda) => (
                <SelectItem key={mda._id} value={mda._id}>
                  {mda.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.mdaId && (
            <p className="text-sm text-red-500">{errors.mdaId.message}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>

          <Input
            id="password"
            type="password"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>
      </div>
    </form>
  );
}
