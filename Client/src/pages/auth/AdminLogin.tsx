import { galaxyBuilding, galaxy } from "@/assets";
import { AdminLoginForm } from "@/components/login/adminLogin-form";


export default function AdminLoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-muted relative hidden lg:block">
        <img
          src={galaxyBuilding}
          alt="Building"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-end">
          <img src={galaxy} alt="logo" className="w-30" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <AdminLoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
