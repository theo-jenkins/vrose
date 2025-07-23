import React, { useState } from 'react';
import { DatasetAnalysisMetadata, analyseDataService } from '../services/analyseDataService';
import { 
  TrashIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface TableActionsProps {
  dataset: DatasetAnalysisMetadata;
  validationData: any;
  isValidating: boolean;
  onDeleted: (datasetId: string) => void;
  onGenerateInsights: (datasetId: string) => void;
}

const TableActions: React.FC<TableActionsProps> = ({
  dataset,
  validationData,
  isValidating,
  onDeleted,
  onGenerateInsights,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canGenerateInsights = validationData?.can_generate_insights || false;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      await analyseDataService.deleteDataset(dataset.id);
      onDeleted(dataset.id);
    } catch (error) {
      console.error('Error deleting dataset:', error);
      setDeleteError('Failed to delete dataset. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleGenerateInsights = () => {
    if (canGenerateInsights) {
      onGenerateInsights(dataset.id);
    }
  };

  if (showDeleteConfirm) {
    return (
      <div className="space-y-3">
        {deleteError && (
          <div className="p-3 bg-light-error/10 dark:bg-dark-error/10 border border-light-error/40 dark:border-dark-error/40 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-light-error dark:text-dark-error mr-2" />
              <span className="text-sm text-light-error dark:text-dark-error">{deleteError}</span>
            </div>
          </div>
        )}
        
        <div className="p-4 bg-light-text/5 dark:bg-dark-text/5 border border-light-text/20 dark:border-dark-text/20 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-light-text dark:text-dark-text mr-2 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-light-text dark:text-dark-text font-medium">
                Are you sure you want to delete this dataset?
              </p>
              <p className="text-sm text-light-text dark:text-dark-text opacity-80 mt-1">
                This action cannot be undone. The dataset "{dataset.dataset_name}" will be permanently removed.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-light-error dark:bg-dark-error hover:bg-light-error/90 dark:hover:bg-dark-error/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-light-text/20 dark:border-dark-text/20 text-sm font-medium rounded-lg text-light-text dark:text-dark-text bg-light-form-field dark:bg-dark-form-field hover:bg-light-background dark:hover:bg-dark-background disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex space-x-3">
      {/* Generate Insights Button */}
      <button
        onClick={handleGenerateInsights}
        disabled={!canGenerateInsights || isValidating}
        className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg transition-all duration-300 ${
          canGenerateInsights && !isValidating
            ? 'bg-light-primary-button dark:bg-dark-primary-button text-light-button-text dark:text-dark-button-text hover:bg-light-button-hover dark:hover:bg-dark-button-hover'
            : 'bg-light-text/20 dark:bg-dark-text/20 text-light-text/40 dark:text-dark-text/40 cursor-not-allowed'
        }`}
        title={
          !canGenerateInsights 
            ? 'All required headers must be validated before generating insights'
            : 'Generate insights for this dataset'
        }
      >
        <ChartBarIcon className="h-4 w-4 mr-2" />
        Generate Insights
      </button>

      {/* Delete Button */}
      <button
        onClick={() => setShowDeleteConfirm(true)}
        disabled={isDeleting || isValidating}
        className="px-4 py-2 border border-light-text/20 dark:border-dark-text/20 text-sm font-medium rounded-lg text-light-text dark:text-dark-text bg-light-form-field dark:bg-dark-form-field hover:bg-light-error/10 dark:hover:bg-dark-error/10 hover:text-light-error dark:hover:text-dark-error hover:border-light-error/40 dark:hover:border-dark-error/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        title="Delete this dataset"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default TableActions;