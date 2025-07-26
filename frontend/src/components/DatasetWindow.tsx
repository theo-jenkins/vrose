import React from 'react';
import { 
  DocumentIcon, 
  CalendarIcon, 
  CircleStackIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface DatasetWindowProps {
  dataset: {
    id: string;
    dataset_name: string;
    file_size_mb: number;
    created_at: string;
    is_analysis_ready: boolean;
    validation_summary?: {
      all_found: boolean;
      found_count: number;
      can_generate_insights: boolean;
    };
  };
}

const DatasetWindow: React.FC<DatasetWindowProps> = ({ dataset }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getValidationStatus = () => {
    if (!dataset.is_analysis_ready) {
      return {
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        icon: <ExclamationTriangleIcon className="h-4 w-4" />,
        text: 'Not Validated'
      };
    }

    if (dataset.validation_summary?.can_generate_insights) {
      return {
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        icon: <CheckCircleIcon className="h-4 w-4" />,
        text: 'Ready for Analysis'
      };
    }

    return {
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: <ExclamationTriangleIcon className="h-4 w-4" />,
      text: 'Partially Validated'
    };
  };

  const validationStatus = getValidationStatus();

  return (
    <div className="bg-light-form-field dark:bg-dark-form-field rounded-lg border border-light-text/20 dark:border-dark-text/20 p-6">
      <div className="flex items-center mb-4">
        <CircleStackIcon className="h-6 w-6 text-light-primary-button dark:text-dark-primary-button mr-3" />
        <h2 className="text-lg font-semibold text-light-text dark:text-dark-text">
          Dataset Information
        </h2>
      </div>

      {/* Dataset Name */}
      <div className="mb-4">
        <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-2 truncate">
          {dataset.dataset_name}
        </h3>
      </div>

      {/* Dataset Metadata */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center text-sm text-light-text dark:text-dark-text opacity-80">
          <DocumentIcon className="h-4 w-4 mr-2" />
          <span>{dataset.file_size_mb} MB</span>
        </div>
        
        <div className="flex items-center text-sm text-light-text dark:text-dark-text opacity-80">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <span>Created {formatDate(dataset.created_at)}</span>
        </div>
      </div>

      {/* Validation Status */}
      <div className={`p-3 rounded-lg border ${validationStatus.bg} ${validationStatus.border}`}>
        <div className="flex items-center">
          <div className={`mr-3 ${validationStatus.color}`}>
            {validationStatus.icon}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${validationStatus.color}`}>
              {validationStatus.text}
            </p>
            {dataset.validation_summary && (
              <p className={`text-xs mt-1 ${validationStatus.color} opacity-80`}>
                {dataset.validation_summary.found_count} headers found
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Requirements Section */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-light-text dark:text-dark-text mb-3">
          Analysis Requirements
        </h4>
        
        <div className="space-y-2 text-xs text-light-text dark:text-dark-text opacity-70">
          <div className="flex items-center">
            <CheckCircleIcon className="h-3 w-3 mr-2 text-green-500" />
            <span>Dataset uploaded and processed</span>
          </div>
          <div className="flex items-center">
            {dataset.is_analysis_ready ? (
              <CheckCircleIcon className="h-3 w-3 mr-2 text-green-500" />
            ) : (
              <ExclamationTriangleIcon className="h-3 w-3 mr-2 text-yellow-500" />
            )}
            <span>Headers validated</span>
          </div>
          <div className="flex items-center">
            {dataset.validation_summary?.can_generate_insights ? (
              <CheckCircleIcon className="h-3 w-3 mr-2 text-green-500" />
            ) : (
              <ExclamationTriangleIcon className="h-3 w-3 mr-2 text-yellow-500" />
            )}
            <span>Required columns identified</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-light-text/10 dark:border-dark-text/10">
        <h4 className="text-sm font-medium text-light-text dark:text-dark-text mb-2">
          Quick Stats
        </h4>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-light-text dark:text-dark-text opacity-70">Dataset ID:</span>
            <span className="text-light-text dark:text-dark-text font-mono">
              {dataset.id.slice(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-light-text dark:text-dark-text opacity-70">Size:</span>
            <span className="text-light-text dark:text-dark-text">
              {dataset.file_size_mb} MB
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-light-text dark:text-dark-text opacity-70">Status:</span>
            <span className={`text-xs px-2 py-1 rounded ${
              dataset.is_analysis_ready 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {dataset.is_analysis_ready ? 'Ready' : 'Pending'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetWindow;