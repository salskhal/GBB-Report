import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { useMDAs, useDeleteMDA } from '@/hooks/useMDAs';
import CreateMDAModal from '@/components/modals/CreateMDAModal';
import UpdateMDAModal from '@/components/modals/UpdateMDAModal';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import type { MDA } from '@/services/adminService';

export default function MDAManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMDA, setSelectedMDA] = useState<MDA | null>(null);

  // Fetch data from backend
  const { data: mdas = [], isLoading: mdasLoading, error: mdasError } = useMDAs();
  const deleteMDAMutation = useDeleteMDA();

  const handleUpdateMDA = (mda: MDA) => {
    setSelectedMDA(mda);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteMDA = (mda: MDA) => {
    setSelectedMDA(mda);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMDA = async () => {
    if (!selectedMDA) return;
    
    try {
      await deleteMDAMutation.mutateAsync(selectedMDA._id);
      setIsDeleteModalOpen(false);
      setSelectedMDA(null);
    } catch (error) {
      console.error('Failed to delete MDA:', error);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    return isActive
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-red-100 text-red-800`;
  };

  const filteredMDAs = mdas.filter(mda => {
    const matchesSearch = mda.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === '' || 
                         (selectedStatus === 'Active' && mda.isActive) || 
                         (selectedStatus === 'Inactive' && !mda.isActive);
    return matchesSearch && matchesStatus;
  });

  const activeMDAs = mdas.filter(mda => mda.isActive).length;

  if (mdasLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading MDAs...</div>
      </div>
    );
  }

  if (mdasError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading MDAs. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MDA Management</h1>
          <p className="text-gray-600 mt-2">Manage Ministries, Departments, and Agencies</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="mt-4 sm:mt-0 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Add MDA</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total MDAs</p>
              <p className="text-2xl font-bold text-gray-900">{mdas.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <Building2 size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active MDAs</p>
              <p className="text-2xl font-bold text-gray-900">{activeMDAs}</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <Building2 size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search MDAs..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* MDA Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMDAs.map((mda) => (
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
                  <p className="text-sm text-gray-600 mt-2">
                    <a href={mda.reportUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center">
                      <span>Report URL</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  
                  <button 
                    className="text-gray-500 hover:text-gray-700 p-1 rounded"
                    onClick={() => handleUpdateMDA(mda)}
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="text-red-500 hover:text-red-700 p-1 rounded"
                    onClick={() => handleDeleteMDA(mda)}
                    disabled={deleteMDAMutation.isPending}
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

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-700">
          Showing {filteredMDAs.length} of {mdas.length} MDAs
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
            1
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>

      {/* Create MDA Modal */}
      <CreateMDAModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Update MDA Modal */}
      <UpdateMDAModal 
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        mda={selectedMDA}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteMDA}
        title="Delete MDA"
        message="Are you sure you want to delete this MDA? This action cannot be undone and will affect all users associated with this MDA."
        itemName={selectedMDA?.name}
        isDeleting={deleteMDAMutation.isPending}
      />
    </div>
  );
}