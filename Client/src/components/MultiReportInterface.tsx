// import React, { useState, useEffect } from 'react';
// import type { User } from '@/types';
// import { 
//   getActiveReports, 
//   getSavedReport, 
//   saveSelectedReport, 
//   formatReportTitle,
//   type Report
// } from '@/lib/reportUtils';

// interface MultiReportInterfaceProps {
//   user: User;
//   onReportSelect: (report: Report | null) => void;
//   selectedReport: Report | null;
//   isLoading?: boolean;
// }

// const MultiReportInterface: React.FC<MultiReportInterfaceProps> = ({
//   user,
//   onReportSelect,
//   selectedReport,
//   isLoading = false
// }) => {
//   const [localSelectedReport, setLocalSelectedReport] = useState<Report | null>(null);

//   // Get active reports from user's MDA using utility function
//   const activeReports = getActiveReports(user);

//   // Initialize selected report
//   useEffect(() => {
//     if (activeReports.length > 0 && !selectedReport) {
//       // Try to restore from session storage first
//       const savedReport = getSavedReport(user);
      
//       // Use saved report or default to first active report
//       const initialReport = savedReport || activeReports[0];
//       setLocalSelectedReport(initialReport);
//       onReportSelect(initialReport);
//     } else if (selectedReport) {
//       setLocalSelectedReport(selectedReport);
//     }
//   }, [activeReports, selectedReport, user, onReportSelect]);

//   // Handle report selection
//   const handleReportSelect = (report: Report) => {
//     setLocalSelectedReport(report);
//     onReportSelect(report);
//     // Save selection to session storage using utility function
//     saveSelectedReport(user.mda.id, report.title);
//   };

//   // No reports available
//   if (activeReports.length === 0) {
//     return (
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900">
//               {user?.mda?.name} Reports
//             </h3>
//             <p className="text-sm text-gray-600 mt-1">
//               No reports are currently available for your organization
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Single report - no selection interface needed
//   if (activeReports.length === 1) {
//     return (
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900">
//               {activeReports[0].title}
//             </h3>
//             <p className="text-sm text-gray-600 mt-1">
//               {user?.mda?.name} - Real-time data and analytics
//             </p>
//           </div>
//           {isLoading && (
//             <div className="flex items-center space-x-2">
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
//               <span className="text-sm text-gray-500">Loading...</span>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }

//   // Multiple reports - show tabs interface
//   return (
//     <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//       {/* Header */}
//       <div className="px-4 py-3 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900">
//               {user?.mda?.name} Reports
//             </h3>
//             <p className="text-sm text-gray-600 mt-1">
//               Select a report to view real-time data and analytics
//             </p>
//           </div>
//           {isLoading && (
//             <div className="flex items-center space-x-2">
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
//               <span className="text-sm text-gray-500">Loading...</span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Report Tabs */}
//       <div className="px-4">
//         <nav className="flex space-x-8" aria-label="Report tabs">
//           {activeReports.map((report, index) => {
//             const isSelected = localSelectedReport?.title === report.title;
//             return (
//               <button
//                 key={`${report.title}-${index}`}
//                 onClick={() => handleReportSelect(report)}
//                 disabled={isLoading}
//                 className={`
//                   whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
//                   ${isSelected
//                     ? 'border-blue-500 text-blue-600'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                   }
//                   ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
//                 `}
//                 aria-current={isSelected ? 'page' : undefined}
//               >
//                 {formatReportTitle(report.title)}
//               </button>
//             );
//           })}
//         </nav>
//       </div>
//     </div>
//   );
// };

// export default MultiReportInterface;


// import React from "react";
// import type { User } from "@/types";
// import {
//   getActiveReports,
//   saveSelectedReport,
//   formatReportTitle,
//   type Report,
// } from "@/lib/reportUtils";

// interface MultiReportInterfaceProps {
//   user: User;
//   onReportSelect: (report: Report | null) => void;
//   selectedReport: Report | null;
//   isLoading?: boolean;
// }

// const MultiReportInterface: React.FC<MultiReportInterfaceProps> = ({
//   user,
//   onReportSelect,
//   selectedReport,
//   isLoading = false,
// }) => {
//   const activeReports = getActiveReports(user);

//   // No reports available
//   if (activeReports.length === 0) {
//     return (
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900">
//               {user?.mda?.name} Reports
//             </h3>
//             <p className="text-sm text-gray-600 mt-1">
//               No reports are currently available for your organization
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Single report – just display title, no tabs
//   if (activeReports.length === 1) {
//     return (
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900">
//               {activeReports[0].title}
//             </h3>
//             <p className="text-sm text-gray-600 mt-1">
//               {user?.mda?.name} - Real-time data and analytics
//             </p>
//           </div>
//           {isLoading && (
//             <div className="flex items-center space-x-2">
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
//               <span className="text-sm text-gray-500">Loading...</span>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }

//   // Multiple reports – render tab buttons
//   const handleReportSelect = (report: Report) => {
//     onReportSelect(report);
//     saveSelectedReport(user.mda.id, report.title);
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//       {/* Header */}
//       <div className="px-4 py-3 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900">
//               {user?.mda?.name} Reports
//             </h3>
//             <p className="text-sm text-gray-600 mt-1">
//               Select a report to view real-time data and analytics
//             </p>
//           </div>
//           {isLoading && (
//             <div className="flex items-center space-x-2">
//               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
//               <span className="text-sm text-gray-500">Loading...</span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="px-4">
//         <nav className="flex space-x-8" aria-label="Report tabs">
//           {activeReports.map((report, index) => {
//             const isSelected = selectedReport?.title === report.title;
//             return (
//               <button
//                 key={`${report.title}-${index}`}
//                 onClick={() => handleReportSelect(report)}
//                 disabled={isLoading}
//                 className={`
//                   whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
//                   ${isSelected
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
//                   ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
//                 `}
//                 aria-current={isSelected ? "page" : undefined}
//               >
//                 {formatReportTitle(report.title)}
//               </button>
//             );
//           })}
//         </nav>
//       </div>
//     </div>
//   );
// };

// export default MultiReportInterface;


import React from "react";
import type { User } from "@/types";
import { getActiveReports, formatReportTitle, saveSelectedReport, type Report } from "@/lib/reportUtils";

interface MultiReportInterfaceProps {
  user: User;
  onReportSelect: (report: Report | null) => void;
  selectedReport: Report | null;
  isLoading?: boolean;
}

const MultiReportInterface: React.FC<MultiReportInterfaceProps> = ({
  user,
  onReportSelect,
  selectedReport,
  isLoading = false,
}) => {
  const activeReports = getActiveReports(user);
  
  console.log('MultiReportInterface - User:', user?.name, 'MDA:', user?.mda?.name);
  console.log('MultiReportInterface - Active reports:', activeReports);
  console.log('MultiReportInterface - Selected report:', selectedReport?.title);

  if (activeReports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900">{user?.mda?.name} Reports</h3>
        <p className="text-sm text-gray-600 mt-1">
          No reports are currently available for your organization
        </p>
      </div>
    );
  }

  if (activeReports.length === 1) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {activeReports[0].title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {user?.mda?.name} - Real-time data and analytics
            </p>
          </div>
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-b-2 border-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {user?.mda?.name} Reports
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Select a report to view real-time data and analytics
          </p>
        </div>

      </div>

      <div className="px-4">
        <nav className="flex space-x-8" aria-label="Report tabs">
          {activeReports.map((report, index) => {
            const isSelected = selectedReport?.title === report.title;
            
            const handleTabClick = () => {
              console.log('Tab clicked:', report.title, 'Current selected:', selectedReport?.title);
              onReportSelect(report);
              saveSelectedReport(user.mda.id, report.title);
            };
            
            return (
              <button
                key={`${report.title}-${index}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTabClick();
                }}
                disabled={isLoading}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${isSelected
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
                  ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}
                `}
                aria-current={isSelected ? "page" : undefined}
              >
                {formatReportTitle(report.title)}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default MultiReportInterface;
