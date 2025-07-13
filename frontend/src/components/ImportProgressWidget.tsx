import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

interface ImportProgress {
  task_id: string;
  status: string;
  current: number;
  total: number;
  percentage: number;
  message: string;
  table_name: string;
  error_message?: string;
}

interface ImportProgressWidgetProps {
  taskId?: string;
  onComplete?: (taskId: string) => void;
  onError?: (taskId: string, error: string) => void;
}

const ImportProgressWidget: React.FC<ImportProgressWidgetProps> = ({
  taskId,
  onComplete,
  onError
}) => {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  // Use refs to store callback functions to prevent useEffect dependency issues
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  
  // Update refs when props change
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  const fetchProgress = useCallback(async () => {
    if (!taskId) return false; // Return false to indicate we should not continue polling

    try {
      const response = await api.get(`/features/upload-file/import-progress/${taskId}/`);
      const progressData = response.data;
      
      setProgress(progressData);
      
      // Handle completion
      if (progressData.status === 'completed') {
        if (onCompleteRef.current) {
          onCompleteRef.current(taskId);
        }
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
        return false; // Stop polling
      }
      
      // Handle errors
      if (progressData.status === 'failed') {
        if (onErrorRef.current) {
          onErrorRef.current(taskId, progressData.error_message || 'Import failed');
        }
        return false; // Stop polling
      }
      
      return true; // Continue polling for pending/processing status
      
    } catch (error) {
      console.error('Error fetching import progress:', error);
      if (onErrorRef.current) {
        onErrorRef.current(taskId, 'Failed to fetch progress');
      }
      return false; // Stop polling on API error
    }
  }, [taskId]); // Remove onComplete and onError from dependencies

  useEffect(() => {
    if (taskId) {
      setIsVisible(true);
      
      let intervalId: NodeJS.Timeout;
      
      const startPolling = async () => {
        // Initial fetch
        const shouldContinue = await fetchProgress();
        
        if (shouldContinue) {
          // Only start interval if we should continue polling
          intervalId = setInterval(async () => {
            const continuePolling = await fetchProgress();
            if (!continuePolling) {
              clearInterval(intervalId);
            }
          }, 2000); // Every 2 seconds
        }
      };
      
      startPolling();
      
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    } else {
      setIsVisible(false);
    }
  }, [taskId, fetchProgress]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'processing':
        return 'text-blue-600 dark:text-blue-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (!isVisible || !progress) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={toggleExpanded}
        >
          <div className="flex items-center space-x-3">
            <div className={getStatusColor(progress.status)}>
              {getStatusIcon(progress.status)}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Data Import
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {progress.table_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleExpanded}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4">
            {/* Progress Bar */}
            {progress.status === 'processing' && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>{progress.current} of {progress.total}</span>
                  <span>{progress.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Status Message */}
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {progress.message}
            </div>

            {/* Error Message */}
            {progress.status === 'failed' && progress.error_message && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {progress.error_message}
              </div>
            )}

            {/* Success Actions */}
            {progress.status === 'completed' && (
              <div className="flex space-x-2">
                <button className="text-xs px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/40">
                  View Data
                </button>
                <button 
                  onClick={handleClose}
                  className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportProgressWidget;