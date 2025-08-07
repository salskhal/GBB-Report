import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import type { MDA } from '@/services/adminService';

interface MDATableViewProps {
  mdas: MDA[];
  onUpdateMDA: (mda: MDA) => void;
  onDeleteMDA: (mda: MDA) => void;
  isDeleting?: boolean;
}

const MDATableView: React.FC<MDATableViewProps> = ({
  mdas,
  onUpdateMDA,
  onDeleteMDA,
  isDeleting = false
}) => {
  const getStatusBadge = (isActive: boolean) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    return isActive
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-red-100 text-red-800`;
  };

  if (mdas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            No MDAs found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or add a new MDA
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MDA Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reports
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mdas.map((mda) => (
              <tr key={mda._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {mda.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {mda.reports && mda.reports.length > 0 ? (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 mb-1">
                          Total: {mda.reports.length} | Active: {mda.reports.filter(r => r.isActive).length}
                        </div>
                        {mda.reports.slice(0, 2).map((report, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600 truncate max-w-32">
                              {report.title}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                              report.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {report.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ))}
                        {mda.reports.length > 2 && (
                          <div className="text-xs text-gray-400">
                            +{mda.reports.length - 2} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic">No reports</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(mda.isActive)}>
                    {mda.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(mda.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(mda.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button 
                      className="text-gray-500 hover:text-gray-700 p-1 rounded"
                      onClick={() => onUpdateMDA(mda)}
                      title="Edit MDA"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-700 p-1 rounded"
                      onClick={() => onDeleteMDA(mda)}
                      disabled={isDeleting}
                      title="Delete MDA"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MDATableView;