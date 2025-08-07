import React from 'react';
import { Edit, Trash2, Building2 } from 'lucide-react';
import type { MDA } from '@/services/adminService';

interface MDACardViewProps {
  mdas: MDA[];
  onUpdateMDA: (mda: MDA) => void;
  onDeleteMDA: (mda: MDA) => void;
  isDeleting?: boolean;
}

const MDACardView: React.FC<MDACardViewProps> = ({
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
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          No MDAs found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters or add a new MDA
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {mdas.map((mda) => (
        <div key={mda._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Building2 size={20} className="text-gray-500" />
                  <h3 className="text-lg font-semibold text-gray-900">{mda.name}</h3>
                  <span className={getStatusBadge(mda.isActive)}>
                    {mda.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Reports ({mda.reports?.length || 0}):</p>
                  {mda.reports && mda.reports.length > 0 ? (
                    <div className="space-y-1">
                      {mda.reports.map((report, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">{report.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              report.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {report.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <a 
                            href={report.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-500 hover:text-blue-700 flex items-center"
                            title={`Open ${report.title}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No reports configured</p>
                  )}
                </div>
              </div>
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
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Created: {new Date(mda.createdAt).toLocaleDateString()}</span>
                <span>Last updated: {new Date(mda.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MDACardView;