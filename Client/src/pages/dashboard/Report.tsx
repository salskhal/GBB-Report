import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import MultiReportInterface from "@/components/MultiReportInterface";
import {
  getActiveReports,
  isValidReportUrl,
  validateReport,
  getSavedReport,
  type Report,
} from "@/lib/reportUtils";

const ReportPage = () => {
  const { user } = useAuthStore();

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeReports = getActiveReports(user);

  useEffect(() => {
    if (user?.mda?.id && activeReports.length > 0 && !selectedReport) {
      // Try to restore from session storage first
      const savedReport = getSavedReport(user);
      const initialReport = savedReport || activeReports[0];
      setSelectedReport({ ...initialReport });
    }
  }, [user, activeReports, selectedReport]);

  const handleReportSelect = (report: Report | null) => {
    console.log('handleReportSelect called with:', report?.title);
    if (!report) return;

    const validation = validateReport(report);
    if (!validation.isValid) {
      setError(`Report validation failed: ${validation.errors.join(", ")}`);
      return;
    }

    setError(null);
    setSelectedReport({ ...report });
  };

  if (!user || !user.mda) {
    return (
      <div className="flex items-center justify-center h-[80vh] border border-gray-300 rounded-lg">
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M4.082 19h15.836c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p>Please log in to access your organization's reports.</p>
        </div>
      </div>
    );
  }

  if (activeReports.length === 0) {
    return (
      <div className="space-y-4">
        <MultiReportInterface
          user={user}
          onReportSelect={handleReportSelect}
          selectedReport={null}
          isLoading={false}
        />
        <div className="flex items-center justify-center h-[80vh] border border-gray-300 rounded-lg">
          <div className="text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Available</h3>
            <p>No reports have been configured for your organization ({user.mda.name}).</p>
            <p className="text-sm mt-2 text-gray-400">
              Please contact your administrator to set up report URLs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MultiReportInterface
        user={user}
        onReportSelect={handleReportSelect}
        selectedReport={selectedReport}
        isLoading={isLoading}
      />

      {selectedReport && (
        <div className="border border-gray-300 rounded-lg bg-white overflow-hidden w-full h-[80vh]">
          {error ? (
            <div className="flex items-center justify-center h-full text-red-600 text-center px-4">
              <div>
                <svg className="mx-auto mb-2 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M4.082 19h15.836c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="font-medium mb-1">Failed to load report</p>
                <p className="text-sm text-gray-500">{error}</p>
                <a
                  href={selectedReport.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-blue-600 hover:underline text-sm"
                >
                  Open in new tab instead
                </a>
              </div>
            </div>
          ) : isValidReportUrl(selectedReport.url) ? (
            <iframe
              key={selectedReport.url}
              src={selectedReport.url}
              title={selectedReport.title}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-center px-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Invalid Report URL</h3>
                <p>The URL for "{selectedReport.title}" is not valid.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Please contact your administrator to update the report URL.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportPage;
