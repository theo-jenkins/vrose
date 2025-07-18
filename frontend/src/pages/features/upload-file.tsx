import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import TopBar from '@/components/TopBar';
import FileUpload from '@/components/FileUpload';
import FilePreview from '@/components/FilePreview';
import { addGlobalImport } from '@/components/GlobalImportProgress';
import { RootState } from '../../../redux/store';

interface TemporaryUpload {
  id: string;
  original_filename: string;
  file_size: number;
  file_size_mb: number;
  file_type: string;
  status: string;
  preview_data: any;
  validation_errors: string[] | null;
  created_at: string;
  expires_at: string;
}

const UploadFilePage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const [uploads, setUploads] = useState<TemporaryUpload[]>([]);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Redirect if not authenticated, but only after auth is initialized
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isInitialized, router]);

  const handleUploadComplete = (uploadResponse: any) => {
    if (uploadResponse.success && uploadResponse.upload) {
      setUploads(prev => [...prev, uploadResponse.upload]);
      setSuccessMessage('File uploaded successfully! Review the preview below and confirm to process.');
      setError('');
    }
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccessMessage('');
  };

  const handleFileRemove = (fileId: string, uploadResponse?: any) => {
    // Remove the corresponding preview if it exists
    if (uploadResponse && uploadResponse.upload && uploadResponse.upload.id) {
      setUploads(prev => prev.filter(upload => upload.id !== uploadResponse.upload.id));
      setSuccessMessage('File and preview removed successfully.');
      setError('');
    }
  };

  const handleConfirm = (uploadId: string, selectedColumns: string[]) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
    setSuccessMessage(`Import started for ${selectedColumns.length} columns! Redirecting to dashboard...`);
    setError('');
    
    // Redirect to dashboard after successful upload
    setTimeout(() => {
      router.push('/dashboard/');
    }, 2000);
  };

  const handleDiscard = (uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
    setSuccessMessage('File discarded successfully.');
    setError('');
  };

  const handlePreviewError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccessMessage('');
  };

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#161313]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-accent dark:border-dark-accent mx-auto"></div>
          <p className="text-light-text dark:text-dark-text mt-2">
            {!isInitialized ? 'Loading...' : 'Redirecting to signin...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#161313]">
      <TopBar />
      
      <div className="container mx-auto px-4 pt-20 pb-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-light-text dark:text-dark-text mb-2">
            Upload Files
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload your data files (.csv, .xlsx, .xls) for processing and analysis.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-red-600 dark:text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="ml-3 text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
              <button
                onClick={clearMessages}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-green-600 dark:text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-sm text-green-700 dark:text-green-300">{successMessage}</p>
              </div>
              <button
                onClick={clearMessages}
                className="text-green-400 hover:text-green-600 dark:hover:text-green-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">
            Select Files
          </h2>
          <FileUpload
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            onFileRemove={handleFileRemove}
            multiple={true}
          />
        </div>

        {/* File Previews */}
        {uploads.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-light-text dark:text-dark-text">
              Review Uploads ({uploads.length})
            </h2>
            
            {uploads.map((upload) => (
              <FilePreview
                key={upload.id}
                upload={upload}
                onConfirm={handleConfirm}
                onDiscard={handleDiscard}
                onError={handlePreviewError}
              />
            ))}
          </div>
        )}

        {/* Help Section */}
        {uploads.length === 0 && (
          <div className="mt-12 bg-light-form-field dark:bg-dark-form-field rounded-lg p-6">
            <h3 className="text-lg font-medium text-light-text dark:text-dark-text mb-4">
              Getting Started
            </h3>
            
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-light-primary-button dark:bg-dark-primary-button text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <div>
                  <p className="font-medium text-light-text dark:text-dark-text">Upload your files</p>
                  <p>Drag and drop or click to select CSV, Excel (.xlsx), or legacy Excel (.xls) files up to 50MB each.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-light-primary-button dark:bg-dark-primary-button text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <div>
                  <p className="font-medium text-light-text dark:text-dark-text">Ensure required data columns</p>
                  <p className="mb-2">Your uploaded data must include:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong>Date/time column</strong> (required) - When each sale occurred</li>
                    <li><strong>Sales/revenue column</strong> (required) - The monetary value of each transaction</li>
                  </ul>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Recommended optional columns for better insights: Category, Promotion (boolean), Unit price</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-light-primary-button dark:bg-dark-primary-button text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <div>
                  <p className="font-medium text-light-text dark:text-dark-text">Select columns to import</p>
                  <p>Review the file preview and choose which columns to include in your analysis.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-light-primary-button dark:bg-dark-primary-button text-white rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <div>
                  <p className="font-medium text-light-text dark:text-dark-text">Get AI-powered insights</p>
                  <p>After processing, the platform generates data insights and machine learning predictions. More data features = more accurate predictions!</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadFilePage;