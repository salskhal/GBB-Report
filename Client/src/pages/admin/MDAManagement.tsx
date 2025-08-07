import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Building2 } from 'lucide-react';
import { useMDAs, useDeleteMDA } from '@/hooks/useMDAs';
import { useLayoutPreference } from '@/hooks/useLayoutPreference';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import MDACardView from '@/components/MDACardView';
import MDATableView from '@/components/MDATableView';
import LayoutToggle from '@/components/LayoutToggle';
import type { MDA } from '@/services/adminService';

export default function MDAManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentLayout, setCurrentLayout] = useLayoutPreference('mdas', 'card');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMDA, setSelectedMDA] = useState<MDA | null>(null);

  // Fetch data from backend
  const { data: mdas = [], isLoading: mdasLoading, error: mdasError } = useMDAs();
  const deleteMDAMutation = useDeleteMDA();

  const handleUpdateMDA = (mda: MDA) => {
    navigate(`/admin/dashboard/mdas/update/${mda._id}`);
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



  const filteredMDAs = mdas.filter(mda => {
    const matchesSearch = mda.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === '' || 
                         (selectedStatus === 'Active' && mda.isActive) || 
                         (selectedStatus === 'Inactive' && !mda.isActive);
    return matchesSearch && matchesStatus;
  });

  const activeMDAs = mdas.filter(mda => mda.isActive).length;
  const totalReports = mdas.reduce((total, mda) => total + (mda.reports?.length || 0), 0);
  const activeReports = mdas.reduce((total, mda) => 
    total + (mda.reports?.filter(report => report.isActive).length || 0), 0
  );

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
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <LayoutToggle
            currentLayout={currentLayout}
            onLayoutChange={setCurrentLayout}
          />
          <button 
            onClick={() => navigate('/admin/dashboard/mdas/create')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={16} />
            <span>Add MDA</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Reports</p>
              <p className="text-2xl font-bold text-gray-900">{activeReports}</p>
            </div>
            <div className="p-3 rounded-full bg-emerald-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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

      {/* MDA Display */}
      {currentLayout === 'card' ? (
        <MDACardView
          mdas={filteredMDAs}
          onUpdateMDA={handleUpdateMDA}
          onDeleteMDA={handleDeleteMDA}
          isDeleting={deleteMDAMutation.isPending}
        />
      ) : (
        <MDATableView
          mdas={filteredMDAs}
          onUpdateMDA={handleUpdateMDA}
          onDeleteMDA={handleDeleteMDA}
          isDeleting={deleteMDAMutation.isPending}
        />
      )}

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