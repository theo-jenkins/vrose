import React from 'react';
import { 
  CpuChipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlayIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface InsightEngineStatusProps {
  dataset: any;
  insightAnalysis: any;
  isGenerating: boolean;
  onGenerateInsights: () => void;
}

const InsightEngineStatus: React.FC<InsightEngineStatusProps> = ({
  dataset,
  insightAnalysis,
  isGenerating,
  onGenerateInsights
}) => {
  const getEngineStatus = () => {
    if (isGenerating) {
      return {
        status: 'analyzing',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        icon: <ArrowPathIcon className="h-5 w-5 animate-spin" />,
        title: 'Analyzing Dataset',
        description: 'The insight engine is processing your data...'
      };
    }

    if (insightAnalysis) {
      switch (insightAnalysis.status) {
        case 'completed':
          return {
            status: 'completed',
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-800',
            icon: <CheckCircleIcon className="h-5 w-5" />,
            title: 'Analysis Complete',
            description: 'Insights have been generated successfully'
          };
        case 'failed':
          return {
            status: 'failed',
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800',
            icon: <XCircleIcon className="h-5 w-5" />,
            title: 'Analysis Failed',
            description: insightAnalysis.error_message || 'An error occurred during analysis'
          };
        default:
          return {
            status: 'pending',
            color: 'text-yellow-600 dark:text-yellow-400',
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            border: 'border-yellow-200 dark:border-yellow-800',
            icon: <ClockIcon className="h-5 w-5" />,
            title: 'Analysis Pending',
            description: 'Waiting for analysis to begin'
          };
      }
    }

    if (!dataset?.is_analysis_ready) {
      return {
        status: 'not_ready',
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        border: 'border-gray-200 dark:border-gray-800',
        icon: <ExclamationTriangleIcon className="h-5 w-5" />,
        title: 'Dataset Not Ready',
        description: 'Please validate dataset headers before generating insights'
      };
    }

    return {
      status: 'ready',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: <PlayIcon className="h-5 w-5" />,
      title: 'Ready for Analysis',
      description: 'Click Generate Insights to begin analysis'
    };
  };

  const engineStatus = getEngineStatus();

  return (
    <div className="bg-light-form-field dark:bg-dark-form-field rounded-lg border border-light-text/20 dark:border-dark-text/20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CpuChipIcon className="h-6 w-6 text-light-primary-button dark:text-dark-primary-button mr-3" />
          <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
            Insight Engine
          </h2>
        </div>
        
        {engineStatus.status === 'ready' && (
          <button
            onClick={onGenerateInsights}
            className="px-4 py-2 bg-light-primary-button dark:bg-dark-primary-button text-white rounded-md hover:opacity-90 text-sm flex items-center"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            Generate Insights
          </button>
        )}
      </div>

      {/* Status Card */}
      <div className={`p-4 rounded-lg border ${engineStatus.bg} ${engineStatus.border} mb-6`}>
        <div className="flex items-center">
          <div className={`mr-3 ${engineStatus.color}`}>
            {engineStatus.icon}
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${engineStatus.color}`}>
              {engineStatus.title}
            </h3>
            <p className={`text-xs mt-1 ${engineStatus.color} opacity-80`}>
              {engineStatus.description}
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Methods */}
      {insightAnalysis?.matched_methods && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-light-text dark:text-dark-text mb-3">
            Available Analysis Methods
          </h4>
          <div className="space-y-2">
            {insightAnalysis.matched_methods.map((method: any, index: number) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  insightAnalysis.selected_method?.name === method.name
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-light-text dark:text-dark-text">
                      {method.display_name}
                    </h5>
                    <p className="text-xs text-light-text dark:text-dark-text opacity-70 mt-1">
                      {method.description}
                    </p>
                  </div>
                  <div className="flex items-center ml-4">
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                      {method.confidence_score}% match
                    </span>
                    {insightAnalysis.selected_method?.name === method.name && (
                      <CheckCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-2" />
                    )}
                  </div>
                </div>
                
                {/* Method Details */}
                <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-light-text dark:text-dark-text opacity-70">Required Headers:</span>
                    <div className="mt-1 space-x-1">
                      {method.required_headers_found?.map((header: string, i: number) => (
                        <span key={i} className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                          {header}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-light-text dark:text-dark-text opacity-70">Optional Headers:</span>
                    <div className="mt-1 space-x-1">
                      {method.optional_headers_found?.map((header: string, i: number) => (
                        <span key={i} className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                          {header}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Progress */}
      {insightAnalysis && (
        <div>
          <h4 className="text-sm font-medium text-light-text dark:text-dark-text mb-3">
            Analysis Timeline
          </h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <span className="text-sm text-light-text dark:text-dark-text">Analysis Started</span>
                <span className="text-xs text-light-text dark:text-dark-text opacity-70 ml-2">
                  {new Date(insightAnalysis.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            {insightAnalysis.status === 'completed' && insightAnalysis.completed_at && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <span className="text-sm text-light-text dark:text-dark-text">Analysis Completed</span>
                  <span className="text-xs text-light-text dark:text-dark-text opacity-70 ml-2">
                    {new Date(insightAnalysis.completed_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )}
            
            {insightAnalysis.status === 'analyzing' && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                <div className="flex-1">
                  <span className="text-sm text-light-text dark:text-dark-text">Processing Data...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightEngineStatus;