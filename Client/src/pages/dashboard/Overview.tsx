"use client";

import type React from "react";
import { useAuthStore } from "@/store/authStore";

export const Overview: React.FC = () => {
  const { user } = useAuthStore();

  // Get user display name
  const getUserDisplayName = (): string => {
    if (user?.name) {
      return user.name;
    }
    if (user?.email) {
      const name = user.email.split("@")[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return "User";
  };

  // Get greeting based on time of day
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Overview
          </h2>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Welcome to your dashboard!
            </h3>

            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👋</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-indigo-800">
                    {getGreeting()}, {getUserDisplayName()}!
                  </h4>
                  <p className="text-sm text-indigo-700 mt-1">
                    Organization: {user?.mda.name || "Not specified"}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">{user?.email}</p>
                </div>
              </div>
            </div>

         

            {/* Recent activity section */}
            
          </div>
        </div>
      </div>
    </div>
  );
};
