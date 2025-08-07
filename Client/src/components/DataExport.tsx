import React, { useState } from 'react';
import { adminService } from '@/services/adminService';
import { useMDAs } from '@/hooks/useMDAs';

interface ExportFilters {
  mdaId?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  format: 'csv' | 'json';
}

const DataExport: React.FC = () => {
  const [filters, setFilters] = useState<ExportFilters>({
    format: 'json'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'users' | 'mdas' | 'combined'>('users');

  const { data: mdas = [] } = useMDAs();

  const handleFilterChange = (key: keyof ExportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      let blob: Blob;
      let filename: string;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      switch (exportType) {
        case 'users':
          blob = await adminService.exportUserData(filters);
          filename = `user-data-export-${timestamp}.${filters.format}`;
          break;
        case 'mdas':
          blob = await adminService.exportMDAData({
            isActive: filters.isActive,
            startDate: filters.startDate,
            endDate: filters.endDate,
            format: filters.format
          });
          filename = `mda-data-export-${timestamp}.${filters.format}`;
          break;
        case 'combined':
          blob = await adminService.exportCombinedData(filters);
          filename = `combined-data-export-${timestamp}.${filters.format}`;
          break;
        default:
          throw new Error('Invalid export type');
      }

      downloadBlob(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Data Export</h2>
      
      {/* Export Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Export Type
        </label>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setExportType('users')}
            className={`p-3 text-center rounded-lg border-2 transition-colors ${
              exportType === 'users'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">User Data</div>
            <div className="text-sm text-gray-500">Users with MDA associations</div>
          </button>
          <button
            onClick={() => setExportType('mdas')}
            className={`p-3 text-center rounded-lg border-2 transition-colors ${
              exportType === 'mdas'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">MDA Data</div>
            <div className="text-sm text-gray-500">MDAs with user associations</div>
          </button>
          <button
            onClick={() => setExportType('combined')}
            className={`p-3 text-center rounded-lg border-2 transition-colors ${
              exportType === 'combined'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">Combined Data</div>
            <div className="text-sm text-gray-500">Both users and MDAs</div>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* MDA Filter (only for user and combined exports) */}
        {(exportType === 'users' || exportType === 'combined') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MDA
            </label>
            <select
              value={filters.mdaId || ''}
              onChange={(e) => handleFilterChange('mdaId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All MDAs</option>
              {mdas.map((mda) => (
                <option key={mda._id} value={mda._id}>
                  {mda.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Active Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.isActive === undefined ? '' : filters.isActive.toString()}
            onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Start Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* End Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Export Format
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="json"
              checked={filters.format === 'json'}
              onChange={(e) => handleFilterChange('format', e.target.value as 'json' | 'csv')}
              className="mr-2"
            />
            JSON (Structured data)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="csv"
              checked={filters.format === 'csv'}
              onChange={(e) => handleFilterChange('format', e.target.value as 'json' | 'csv')}
              className="mr-2"
            />
            CSV (Spreadsheet compatible)
          </label>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            isExporting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isExporting ? 'Exporting...' : 'Export Data'}
        </button>
      </div>

      {/* Export Info */}
      <div className="mt-4 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium text-gray-900 mb-2">Export Information</h3>
        <div className="text-sm text-gray-600 space-y-1">
          {exportType === 'users' && (
            <p>• User data includes: user details, MDA associations, and report information</p>
          )}
          {exportType === 'mdas' && (
            <p>• MDA data includes: MDA details, reports, and associated user information</p>
          )}
          {exportType === 'combined' && (
            <p>• Combined data includes both user and MDA data with full associations</p>
          )}
          <p>• JSON format provides structured data suitable for programmatic use</p>
          <p>• CSV format is compatible with spreadsheet applications like Excel</p>
          <p>• Exports include timestamps and can be filtered by date range and status</p>
        </div>
      </div>
    </div>
  );
};

export default DataExport;