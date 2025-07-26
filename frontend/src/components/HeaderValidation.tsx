import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import api from '../services/api';
import { analyseDataService } from '../services/analyseDataService';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

interface HeaderValidationProps {
  tempFileId?: string;
  datasetId?: string;
  selectedColumns?: string[];
  autoValidate?: boolean;
  onValidationComplete?: (results: any) => void;
}

interface ValidationResults {
  validation_status: 'green' | 'amber' | 'red';
  validation_results: {
    required_columns: Record<string, any>;
    optional_columns: Record<string, any>;
  };
  recommendations: string[];
  can_proceed_to_analysis: boolean;
}

const HeaderValidation: React.FC<HeaderValidationProps> = ({
  tempFileId,
  datasetId,
  selectedColumns = [],
  autoValidate = true,
  onValidationComplete
}) => {
  const [results, setResults] = useState<ValidationResults | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize selected columns to prevent unnecessary re-renders
  const memoizedColumns = useMemo(() => selectedColumns, [selectedColumns.join(',')]);

  const validateHeaders = useCallback(async () => {
    if (!tempFileId && !datasetId) return;
    if (memoizedColumns.length === 0) return;

    setIsValidating(true);
    setError(null);

    try {
      let response;
      
      if (tempFileId) {
        response = await api.post(`/features/upload-file/temp/${tempFileId}/validate-headers/`, {
          selected_columns: memoizedColumns
        });
      } else if (datasetId) {
        response = await analyseDataService.validateHeaders(datasetId, {
          force_revalidate: true,
        });
        
        if (response.success && response.validation_summary) {
          const summary = response.validation_summary;
          response.data = {
            validation_status: summary.all_headers_found ? 'green' : (summary.found_count > 0 ? 'amber' : 'red'),
            can_proceed_to_analysis: summary.can_generate_insights,
            recommendations: [],
            validation_results: response.validation_results || {},
          };
        }
      }
      
      if (response?.data) {
        setResults(response.data);
        onValidationComplete?.(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  }, [tempFileId, datasetId, memoizedColumns, onValidationComplete]);

  // Auto-validate when columns change
  useEffect(() => {
    if (autoValidate && memoizedColumns.length > 0) {
      validateHeaders();
    }
  }, [autoValidate, validateHeaders]);

  // Get required and optional headers from results
  const requiredHeaders = useMemo(() => 
    Object.keys(results?.validation_results?.required_columns || {}), 
    [results?.validation_results?.required_columns]
  );
  
  const optionalHeaders = useMemo(() => 
    Object.keys(results?.validation_results?.optional_columns || {}), 
    [results?.validation_results?.optional_columns]
  );

  // Status styling helpers
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'green': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400';
      case 'amber': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400';
      case 'red': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green': return <CheckCircleIcon className="h-5 w-5" />;
      case 'amber': case 'red': return <ExclamationTriangleIcon className="h-5 w-5" />;
      default: return <InformationCircleIcon className="h-5 w-5" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'green': return 'All required headers found - Ready for analysis!';
      case 'amber': return 'Required headers found - Optional headers missing';
      case 'red': return 'Missing required headers - Analysis not possible';
      default: return 'Validation status unknown';
    }
  };

  const getHeaderStatus = (headerKey: string, isRequired: boolean) => {
    const headerResults = isRequired 
      ? results?.validation_results?.required_columns 
      : results?.validation_results?.optional_columns;
    return headerResults?.[headerKey]?.is_found || false;
  };

  const getMatchedColumn = (headerKey: string, isRequired: boolean) => {
    const headerResults = isRequired 
      ? results?.validation_results?.required_columns 
      : results?.validation_results?.optional_columns;
    return headerResults?.[headerKey]?.matched_column || null;
  };

  // Configuration check
  if (!tempFileId && !datasetId) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="text-red-600 dark:text-red-400 text-sm">
          Configuration error: No validation target specified
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h4 className="text-sm font-medium text-light-text dark:text-dark-text mb-3">
        Header Validation for Sales Analysis
      </h4>

      {/* Fixed container to prevent DOM changes */}
      <div className="relative min-h-[200px]">
        
        {/* Loading overlay - always rendered, opacity controlled */}
        <div className={`absolute inset-0 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center z-10 rounded transition-opacity duration-200 ${
          isValidating ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="flex items-center">
            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin text-light-primary-button dark:text-dark-primary-button" />
            <span className="text-sm text-light-text dark:text-dark-text">Validating headers...</span>
          </div>
        </div>

        {/* Error state - always rendered, opacity controlled */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          error && !isValidating ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 w-full">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Validation Error</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={validateHeaders}
              className="mt-3 text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>

        {/* No results state - always rendered, opacity controlled */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          !results && !isValidating && !error ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center text-light-text dark:text-dark-text opacity-80">
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">Headers not validated yet</span>
            </div>
            <button
              onClick={validateHeaders}
              className="text-xs px-3 py-1 bg-light-primary-button dark:bg-dark-primary-button text-white rounded hover:opacity-90"
            >
              Validate Headers
            </button>
          </div>
        </div>

        {/* Results content - always rendered, opacity controlled */}
        <div className={`transition-opacity duration-200 ${
          results && !isValidating && !error ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {results && (
            <>
              {/* Status message */}
              <div className={`flex items-center p-3 rounded-lg border mb-4 ${getStatusStyles(results.validation_status)}`}>
                <div className="mr-3">
                  {getStatusIcon(results.validation_status)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {getStatusMessage(results.validation_status)}
                  </p>
                  <p className="text-xs mt-1 opacity-80">
                    Validating {memoizedColumns.length} selected column{memoizedColumns.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Required headers */}
              {requiredHeaders.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-light-text dark:text-dark-text mb-2">
                    Required Headers:
                  </h5>
                  <div className="space-y-2">
                    {requiredHeaders.map((headerKey) => {
                      const isFound = getHeaderStatus(headerKey, true);
                      const matchedColumn = getMatchedColumn(headerKey, true);
                      
                      return (
                        <div key={headerKey} className="flex items-center">
                          <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 ${
                            isFound 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          }`}>
                            {isFound ? <CheckCircleIcon className="w-3 h-3" /> : <ExclamationTriangleIcon className="w-3 h-3" />}
                          </div>
                          <span className="text-sm text-light-text dark:text-dark-text">
                            {headerKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            {isFound && matchedColumn && (
                              <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                                → <code className="bg-green-100 dark:bg-green-800 px-1 rounded">{matchedColumn}</code>
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Optional headers */}
              {optionalHeaders.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-light-text dark:text-dark-text mb-2">
                    Optional Headers:
                  </h5>
                  <div className="space-y-2">
                    {optionalHeaders.map((headerKey) => {
                      const isFound = getHeaderStatus(headerKey, false);
                      const matchedColumn = getMatchedColumn(headerKey, false);
                      
                      return (
                        <div key={headerKey} className="flex items-center">
                          <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 ${
                            isFound 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                          }`}>
                            {isFound ? <CheckCircleIcon className="w-3 h-3" /> : <InformationCircleIcon className="w-3 h-3" />}
                          </div>
                          <span className="text-sm text-light-text dark:text-dark-text opacity-80">
                            {headerKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            {isFound && matchedColumn && (
                              <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                                → <code className="bg-green-100 dark:bg-green-800 px-1 rounded">{matchedColumn}</code>
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple comparison function for React.memo
const areEqual = (prev: HeaderValidationProps, next: HeaderValidationProps) => {
  return (
    prev.tempFileId === next.tempFileId &&
    prev.datasetId === next.datasetId &&
    prev.selectedColumns?.join(',') === next.selectedColumns?.join(',') &&
    prev.autoValidate === next.autoValidate
  );
};

export default memo(HeaderValidation, areEqual);