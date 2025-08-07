import React from 'react';
import { Grid3X3, List } from 'lucide-react';

interface LayoutToggleProps {
  currentLayout: 'card' | 'table';
  onLayoutChange: (layout: 'card' | 'table') => void;
  className?: string;
}

const LayoutToggle: React.FC<LayoutToggleProps> = ({
  currentLayout,
  onLayoutChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-1 bg-gray-100 rounded-lg p-1 ${className}`}>
      <button
        onClick={() => onLayoutChange('card')}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          currentLayout === 'card'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Card View"
      >
        <Grid3X3 size={16} />
        <span>Cards</span>
      </button>
      <button
        onClick={() => onLayoutChange('table')}
        className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          currentLayout === 'table'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Table View"
      >
        <List size={16} />
        <span>Table</span>
      </button>
    </div>
  );
};

export default LayoutToggle;