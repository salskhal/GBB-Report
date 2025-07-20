import { useAuthStore } from "@/store/authStore";

const Report = () => {
  const { user } = useAuthStore();

  // Get the report URL from user's MDA
  const reportUrl = user?.mda?.reportUrl;

  if (!reportUrl) {
    return (
      <div className="flex items-center justify-center h-[80vh] border border-gray-300 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Available</h3>
          <p className="text-gray-500">
            No report URL has been configured for your organization ({user?.mda?.name || 'Unknown'}).
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Please contact your administrator to set up the report URL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Report Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user?.mda?.name} Report
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Real-time data and analytics for your organization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in New Tab
            </a>
          </div>
        </div>
      </div>

      {/* Report Iframe */}
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        <iframe
          src={reportUrl}
          title={`${user?.mda?.name} Report`}
          className="w-full h-[80vh] border-0"
          sandbox="allow-scripts allow-same-origin allow-forms"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default Report;
