import type { User } from '@/types';

export interface Report {
  title: string;
  url: string;
  isActive: boolean;
}

/**
 * Validates if a URL is a proper HTTP/HTTPS URL
 */
export const isValidReportUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Gets all active reports for a user's MDA
 */
export const getActiveReports = (user: User | null): Report[] => {
  if (!user?.mda?.reports) {
    return [];
  }
  
  return user.mda.reports.filter(report => report.isActive && report.url);
};

/**
 * Gets a specific report by title from user's MDA
 */
export const getReportByTitle = (user: User | null, title: string): Report | null => {
  const activeReports = getActiveReports(user);
  return activeReports.find(report => report.title === title) || null;
};

/**
 * Gets the default report for a user (first active report)
 */
export const getDefaultReport = (user: User | null): Report | null => {
  const activeReports = getActiveReports(user);
  return activeReports.length > 0 ? activeReports[0] : null;
};

/**
 * Validates a report object
 */
export const validateReport = (report: Report): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!report.title || report.title.trim().length === 0) {
    errors.push('Report title is required');
  }
  
  if (!report.url || report.url.trim().length === 0) {
    errors.push('Report URL is required');
  } else if (!isValidReportUrl(report.url)) {
    errors.push('Report URL must be a valid HTTP or HTTPS URL');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Formats report title for display
 */
export const formatReportTitle = (title: string): string => {
  return title.trim();
};

/**
 * Gets report session storage key for a specific MDA
 */
export const getReportStorageKey = (mdaId: string): string => {
  return `selectedReport_${mdaId}`;
};

/**
 * Saves selected report to session storage
 */
export const saveSelectedReport = (mdaId: string, reportTitle: string): void => {
  try {
    sessionStorage.setItem(getReportStorageKey(mdaId), reportTitle);
  } catch (error) {
    console.warn('Failed to save selected report to session storage:', error);
  }
};

/**
 * Gets saved report from session storage
 */
export const getSavedReport = (user: User | null): Report | null => {
  if (!user?.mda?.id) {
    return null;
  }
  
  try {
    const savedReportTitle = sessionStorage.getItem(getReportStorageKey(user.mda.id));
    if (savedReportTitle) {
      return getReportByTitle(user, savedReportTitle);
    }
  } catch (error) {
    console.warn('Failed to get saved report from session storage:', error);
  }
  
  return null;
};

/**
 * Clears saved report from session storage
 */
export const clearSavedReport = (mdaId: string): void => {
  try {
    sessionStorage.removeItem(getReportStorageKey(mdaId));
  } catch (error) {
    console.warn('Failed to clear saved report from session storage:', error);
  }
};

/**
 * Gets the appropriate report to display based on user preferences and availability
 */
export const getReportToDisplay = (user: User | null): Report | null => {
  // Try to get saved report first
  const savedReport = getSavedReport(user);
  if (savedReport) {
    return savedReport;
  }
  
  // Fall back to default report
  return getDefaultReport(user);
};

/**
 * Checks if MDA has any configured reports
 */
export const hasReports = (user: User | null): boolean => {
  return getActiveReports(user).length > 0;
};

/**
 * Checks if MDA has multiple reports
 */
export const hasMultipleReports = (user: User | null): boolean => {
  return getActiveReports(user).length > 1;
};

/**
 * Gets report display information for UI
 */
export const getReportDisplayInfo = (user: User | null) => {
  const activeReports = getActiveReports(user);
  const hasReportsAvailable = activeReports.length > 0;
  const hasMultiple = activeReports.length > 1;
  const defaultReport = hasReportsAvailable ? activeReports[0] : null;
  
  return {
    hasReports: hasReportsAvailable,
    hasMultipleReports: hasMultiple,
    reportCount: activeReports.length,
    reports: activeReports,
    defaultReport,
    mdaName: user?.mda?.name || 'Unknown Organization'
  };
};