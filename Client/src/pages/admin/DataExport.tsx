import React from 'react';
import DataExport from '@/components/DataExport';

const DataExportPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Export</h1>
          <p className="text-gray-600 mt-1">
            Export user and MDA data with their associations
          </p>
        </div>
      </div>

      <DataExport />
    </div>
  );
};

export default DataExportPage;