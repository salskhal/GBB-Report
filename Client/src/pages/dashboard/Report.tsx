import  { useState, } from "react";
import { useAuthStore } from "@/store/authStore";
import MultiReportInterface from "@/components/MultiReportInterface";
import {
  getActiveReports,
  isValidReportUrl,
  validateReport,
  type Report,
} from "@/lib/reportUtils";

const ReportPage = () => {
  const { user } = useAuthStore();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle report selection from MultiReportInterface
  const handleReportSelect = (report: Report | null) => {
    if (report && report.url !== selectedReport?.url) {
      setIsLoading(true);
      setError(null);

      // Validate report before setting
      const validation = validateReport(report);
      if (!validation.isValid) {
        setError(`Report validation failed: ${validation.errors.join(", ")}`);
        setIsLoading(false);
        return;
      }

      setSelectedReport(report);
    }
  };

  // Handle iframe load events
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError(
      "Failed to load report. Please check the report URL or contact your administrator."
    );
  };

  // Get active reports using utility function
  const activeReports = getActiveReports(user);

  // Show fallback if no user or MDA
  if (!user || !user.mda) {
    return (
      <div className="flex items-center justify-center h-[80vh] border border-gray-300 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Authentication Required
          </h3>
          <p className="text-gray-500">
            Please log in to access your organization's reports.
          </p>
        </div>
      </div>
    );
  }

  // Show fallback if no reports available
  if (activeReports.length === 0) {
    return (
      <div className="space-y-4">
        <MultiReportInterface
          user={user}
          onReportSelect={handleReportSelect}
          selectedReport={selectedReport}
          isLoading={isLoading}
        />

        <div className="flex items-center justify-center h-[80vh] border border-gray-300 rounded-lg">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Reports Available
            </h3>
            <p className="text-gray-500">
              No reports have been configured for your organization (
              {user.mda.name}).
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Please contact your administrator to set up report URLs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Multi-Report Interface */}
      <MultiReportInterface
        user={user}
        onReportSelect={handleReportSelect}
        selectedReport={selectedReport}
        isLoading={isLoading}
      />

      {/* Report Display */}
      {selectedReport && (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !error && (
            <div className="flex items-center justify-center h-[80vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Loading {selectedReport.title}...
                </p>
              </div>
            </div>
          )}

          {/* Report Iframe */}
          {!error && isValidReportUrl(selectedReport.url) && (
            <iframe
              src={selectedReport.url}
              title={selectedReport.title}
              className="w-full h-[80vh] border-0"
              sandbox="allow-scripts allow-same-origin allow-forms"
              loading="lazy"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{ display: isLoading ? "none" : "block" }}
            />
          )}

          {/* Invalid URL State */}
          {!error && !isValidReportUrl(selectedReport.url) && (
            <div className="flex items-center justify-center h-[80vh]">
              <div className="text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Invalid Report URL
                </h3>
                <p className="text-gray-500">
                  The URL for "{selectedReport.title}" is not valid.
                </p>
                <p className="text-sm text-gray-400 mt-2">
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
