import React, { useState, useCallback } from 'react';
import { formatFileSize } from '../utils/fileValidation';
import { addGlobalImport } from './GlobalImportProgress';
import api from '../services/api';

interface FilePreviewData {
  columns: string[];
  rows: Array<Record<string, any>>;
  total_rows_sample: number;
  total_columns: number;
}

interface TemporaryUpload {
  id: string;
  original_filename: string;
  file_size: number;
  file_size_mb: number;
  file_type: string;
  status: string;
  preview_data: FilePreviewData;
  validation_errors: string[] | null;
  created_at: string;
  expires_at: string;
}

interface FilePreviewProps {
  upload: TemporaryUpload;
  onConfirm?: (uploadId: string, selectedColumns: string[]) => void;
  onDiscard?: (uploadId: string) => void;
  onError?: (error: string) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  upload,
  onConfirm,
  onDiscard,
  onError
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(upload.preview_data?.columns || [])
  );

  const toggleColumn = useCallback((column: string) => {
    setSelectedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  }, []);

  const selectAllColumns = useCallback(() => {
    setSelectedColumns(new Set(upload.preview_data?.columns || []));
  }, [upload.preview_data?.columns]);

  const deselectAllColumns = useCallback(() => {
    setSelectedColumns(new Set());
  }, []);

  const handleConfirm = async () => {
    if (selectedColumns.size === 0) {
      if (onError) {
        onError('Please select at least one column to import.');
      }
      return;
    }

    setIsConfirming(true);
    try {
      const selectedColumnsArray = Array.from(selectedColumns);
      
      // Call the new column selection API endpoint
      const response = await api.post(`/features/upload-file/select-columns/${upload.id}/`, {
        selected_columns: selectedColumnsArray
      });
      
      // Add to global import tracking if successful
      if (response.data.success && response.data.task_id) {
        addGlobalImport(response.data.task_id);
      }
      
      if (onConfirm) {
        onConfirm(upload.id, selectedColumnsArray);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to confirm upload';
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDiscard = async () => {
    setIsDiscarding(true);
    try {
      await api.delete(`/features/upload-file/discard/${upload.id}/`);
      if (onDiscard) {
        onDiscard(upload.id);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to discard upload';
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsDiscarding(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-light-background dark:bg-dark-background border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6">
      {/* File Info Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-light-text dark:text-dark-text">
              {upload.original_filename}
            </h3>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 space-x-4">
              <span>{formatFileSize(upload.file_size)}</span>
              <span>•</span>
              <span>{upload.file_type.toUpperCase()}</span>
              <span>•</span>
              <span>Uploaded {formatDateTime(upload.created_at)}</span>
            </div>
          </div>
          
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            upload.status === 'validated' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {upload.status}
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {upload.validation_errors && upload.validation_errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Validation Issues
          </h4>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {upload.validation_errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Column Selection */}
      {upload.preview_data && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-light-text dark:text-dark-text">
              Select Columns to Import
            </h4>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedColumns.size} of {upload.preview_data.total_columns} columns selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllColumns}
                  className="text-xs px-2 py-1 bg-light-primary-button dark:bg-dark-primary-button text-white rounded hover:opacity-90"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllColumns}
                  className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Deselect All
                </button>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {upload.preview_data.columns.map((column, index) => {
                      const isSelected = selectedColumns.has(column);
                      return (
                        <th
                          key={index}
                          className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider relative transition-all duration-300 ${
                            isSelected 
                              ? 'text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800' 
                              : 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`truncate ${!isSelected ? 'line-through' : ''}`}>
                              {column}
                            </span>
                            <button
                              onClick={() => toggleColumn(column)}
                              className={`ml-2 p-1 rounded transition-colors ${
                                isSelected
                                  ? 'text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/20'
                                  : 'text-green-600 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900/20'
                              }`}
                              title={isSelected ? 'Remove column' : 'Add column'}
                            >
                              {isSelected ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {upload.preview_data.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {upload.preview_data.columns.map((column, colIndex) => {
                        const isSelected = selectedColumns.has(column);
                        return (
                          <td
                            key={colIndex}
                            className={`px-4 py-3 text-sm transition-all duration-300 ${
                              isSelected 
                                ? 'text-gray-900 dark:text-gray-100' 
                                : 'text-gray-400 dark:text-gray-500 opacity-60'
                            }`}
                          >
                            {row[column] !== null && row[column] !== undefined 
                              ? String(row[column]) 
                              : '-'
                            }
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Showing first {upload.preview_data.total_rows_sample} rows. Click the X or + buttons to remove/add columns.
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Expires: {formatDateTime(upload.expires_at)}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleDiscard}
            disabled={isDiscarding || isConfirming}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDiscarding ? 'Discarding...' : 'Discard'}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isConfirming || isDiscarding || selectedColumns.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-light-primary-button dark:bg-dark-primary-button rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? 'Starting Import...' : `Import ${selectedColumns.size} Column${selectedColumns.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;