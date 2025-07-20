import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, ChevronDown, User, LogOut, Home, FileText, UserCircle } from "lucide-react";
import { galaxyWhite } from "@/assets";
import { useAuthStore } from "@/store/authStore";

// Define types for navigation items
interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean; // Add exact property for path matching
}

// Define props for the dashboard layout
interface DashboardLayoutProps {
  userAvatar?: string;
}

export default function DashboardLayout({
  userAvatar = "",
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] =
    useState<boolean>(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  const location = useLocation();

  // Nav items with icons and exact property for the overview path
  const navItems: NavItem[] = [
    {
      path: "/dashboard",
      label: "Overview",
      icon: <Home size={20} />,
      exact: true, // This will ensure it's only active when the path is exactly "/dashboard"
    },
    {
      path: "/dashboard/report",
      label: "Report",
      icon: <FileText size={20} />,
    },
    {
      path: "/dashboard/profile",
      label: "Profile",
      icon: <UserCircle size={20} />,
    },
  ];

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = (): void => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Get current page title based on path
  const getCurrentPageTitle = (): string => {
    const path = location.pathname.split("/").pop() || "";

    switch (path) {
      case "":
      case "dashboard":
        return "Dashboard Overview";
      case "report":
        return "Report";
      case "profile":
        return "Profile";
      default:
        return "Dashboard";
    }
  };

  // Handle logout action
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get user display name and role
  const getUserDisplayName = (): string => {
    if (user?.name) {
      return user.name;
    }
    if (user?.email) {
      // Extract name from email or use email
      const name = user.email.split("@")[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return "User";
  };

  const getUserRole = (): string => {
    return user?.mda?.name || "User";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {isMobileView && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} ${
          isMobileView ? "fixed z-30" : "relative"
        } transition-transform duration-300 ease-in-out bg-primary text-white w-64 flex flex-col h-full`}
      >
        {/* Logo area */}
        <div className="p-4  flex items-center justify-between">
          <img src={galaxyWhite} alt="" className="w-32" />
        </div>

        {/* Navigation */}
        <nav className="flex-grow py-6 px-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.exact} // Use end prop to make it match exactly
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-white text-primary"
                        : "text-white hover:bg-green-700"
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User profile section */}
        <div className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center">
              {userAvatar ? (
                <img src={userAvatar} alt="User" className="rounded-full" />
              ) : (
                <User size={20} />
              )}
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium">{getUserDisplayName()}</p>
              <p className="text-xs ">{getUserRole()}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Left side - Toggle and page title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none md:hidden"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-xl font-semibold text-gray-800">
                {getCurrentPageTitle()}
              </h2>
            </div>

            {/* Right side - profile dropdown */}
            <div className="flex items-center space-x-4">
              {/* User info display */}
              <div className="hidden md:flex flex-col items-end text-sm">
                <span className="font-medium text-gray-700">
                  {getUserDisplayName()}
                </span>
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt="User"
                        className="rounded-full"
                      />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <ChevronDown size={16} />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <p className="text-xs text-gray-500">{getUserRole()}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} Galaxy Backbone. All rights
              reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
