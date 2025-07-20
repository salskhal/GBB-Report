
import { Users, Building2} from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useMDAs } from '@/hooks/useMDAs';


export default function AdminOverview() {


  // Fetch real data from backend
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: mdas = [], isLoading: mdasLoading } = useMDAs();

  const stats = {
    totalUsers: users.length,
    totalMDAs: mdas.length,
    activeUsers: users.filter(user => user.isActive).length,
    activeMDAs: mdas.filter(mda => mda.isActive).length,
  };

  const StatCard = ({ title, value, icon, color }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {usersLoading || mdasLoading ? '...' : value.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the Galaxy Backbone Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users size={24} className="text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Total MDA's"
          value={stats.totalMDAs}
          icon={<Building2 size={24} className="text-white" />}
          color="bg-purple-500"
        />
      </div>

  
    </div>
  );
}