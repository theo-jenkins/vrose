import React, { useState } from 'react';
import { DatasetAnalysisMetadata, analyseDataService } from '../services/analyseDataService';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface HeaderValidationStatusProps {
  dataset: DatasetAnalysisMetadata;
  validationData: any;
  isValidating: boolean;
  onValidationUpdate: (newValidationData: any) => void;
  onValidatingChange: (isValidating: boolean) => void;
}

const HeaderValidationStatus: React.FC<HeaderValidationStatusProps> = ({
  dataset,
  validationData,
  isValidating,
  onValidationUpdate,
  onValidatingChange,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  // Defensive check for dataset
  if (!dataset) {
    return (
      <div className="text-light-text dark:text-dark-text opacity-80 text-sm">
        Dataset information not available
      </div>
    );
  }

  const handleValidateHeaders = async (forceRevalidate: boolean = false) => {
    try {
      onValidatingChange(true);
      setValidationError(null);
      
      const response = await analyseDataService.validateHeaders(dataset.id, {
        force_revalidate: forceRevalidate,
      });
      
      if (response.success) {
        onValidationUpdate(response.validation_summary);
      } else {
        setValidationError(response.message || 'Validation failed');
      }
    } catch (error) {
      console.error('Error validating headers:', error);
      setValidationError('Failed to validate headers. Please try again.');
    } finally {
      onValidatingChange(false);
    }
  };

  const getHeaderTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      datetime: 'Date/Time',
      product_id: 'Product ID',
      quantity: 'Quantity',
      revenue: 'Revenue',
    };
    return labels[type] || type;
  };

  const renderValidationContent = () => {
    if (isValidating) {
      return (
        <div className="flex items-center text-light-accent dark:text-dark-accent">
          <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
          <span className="text-sm font-medium">Validating headers...</span>
        </div>
      );
    }

    if (!dataset.is_analysis_ready) {
      return (
        <div className="space-y-3">
          <div className="flex items-center text-light-text dark:text-dark-text opacity-80">
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            <span className="text-sm">Headers not validated yet</span>
          </div>
          
          <button
            onClick={() => handleValidateHeaders()}
            className="inline-flex items-center px-3 py-1 border border-light-text/20 dark:border-dark-text/20 text-sm font-medium rounded-lg text-light-text dark:text-dark-text bg-light-form-field dark:bg-dark-form-field hover:bg-light-background dark:hover:bg-dark-background transition-all duration-300"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Validate Headers
          </button>
        </div>
      );
    }

    if (validationData?.all_found) {
      return (
        <div className="space-y-3">
          <div className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">All headers validated successfully!</span>
          </div>
          
          <div className="text-xs text-light-text dark:text-dark-text opacity-80">
            Found all required headers: Date/Time, Product ID, Quantity, Revenue
          </div>
          
          <button
            onClick={() => handleValidateHeaders(true)}
            className="inline-flex items-center px-3 py-1 border border-light-text/20 dark:border-dark-text/20 text-sm font-medium rounded-lg text-light-text dark:text-dark-text bg-light-form-field dark:bg-dark-form-field hover:bg-light-background dark:hover:bg-dark-background transition-all duration-300"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Re-validate
          </button>
        </div>
      );
    }

    // Some headers missing
    const missingHeaders = validationData?.missing_headers || [];
    const foundCount = validationData?.found_count || 0;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center text-yellow-600 dark:text-yellow-400">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">
            {foundCount}/4 headers found
          </span>
        </div>
        
        {missingHeaders.length > 0 && (
          <div className="text-xs text-light-text dark:text-dark-text opacity-80">
            Missing: {missingHeaders.map(getHeaderTypeLabel).join(', ')}
          </div>
        )}
        
        <div className="text-xs text-light-error dark:text-dark-error">
          Cannot generate insights until all headers are found
        </div>
        
        <button
          onClick={() => handleValidateHeaders(true)}
          className="inline-flex items-center px-3 py-1 border border-light-text/20 dark:border-dark-text/20 text-sm font-medium rounded-lg text-light-text dark:text-dark-text bg-light-form-field dark:bg-dark-form-field hover:bg-light-background dark:hover:bg-dark-background transition-all duration-300"
        >
          <ArrowPathIcon className="h-4 w-4 mr-1" />
          Re-validate
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {validationError && (
        <div className="p-3 bg-light-error/10 dark:bg-dark-error/10 border border-light-error/40 dark:border-dark-error/40 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-light-error dark:text-dark-error mr-2" />
            <span className="text-sm text-light-error dark:text-dark-error">{validationError}</span>
          </div>
        </div>
      )}
      
      {renderValidationContent()}
    </div>
  );
};

export default HeaderValidationStatus;