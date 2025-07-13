import React, { useState, useRef, useCallback } from 'react';
import { validateFile, formatFileSize, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB } from '../utils/fileValidation';
import api from '../services/api';

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  uploadResponse?: any;
}

interface FileUploadProps {
  onUploadComplete?: (uploadResponse: any) => void;
  onUploadError?: (error: string) => void;
  onFileRemove?: (fileId: string, uploadResponse?: any) => void;
  multiple?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  onFileRemove,
  multiple = true,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const uploadFile = async (file: File): Promise<void> => {
    const fileId = Math.random().toString(36).substr(2, 9);
    
    // Add file to upload list
    const uploadedFile: UploadedFile = {
      file,
      id: fileId,
      status: 'uploading',
      progress: 0
    };

    setUploadedFiles(prev => [...prev, uploadedFile]);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload file
      const response = await api.post('/features/upload-file/temp/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadedFiles(prev => 
              prev.map(f => 
                f.id === fileId 
                  ? { ...f, progress }
                  : f
              )
            );
          }
        }
      });

      // Update file status
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'success', progress: 100, uploadResponse: response.data }
            : f
        )
      );

      if (onUploadComplete) {
        onUploadComplete(response.data);
      }

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Upload failed';
      
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      );

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // Validate file
      const validation = validateFile(file);
      
      if (!validation.isValid) {
        if (onUploadError) {
          onUploadError(validation.errors.join(', '));
        }
        continue;
      }

      // Upload valid file
      await uploadFile(file);
    }
  }, [onUploadComplete, onUploadError]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFiles(files);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback((fileId: string) => {
    // Find the file being removed to get its upload response
    const fileToRemove = uploadedFiles.find(f => f.id === fileId);
    
    // Remove from local state
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    
    // Notify parent component if callback provided
    if (onFileRemove && fileToRemove?.uploadResponse) {
      onFileRemove(fileId, fileToRemove.uploadResponse);
    }
  }, [uploadedFiles, onFileRemove]);

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragging 
            ? 'border-light-primary-button dark:border-dark-primary-button bg-light-primary-button/10 dark:bg-dark-primary-button/10' 
            : 'border-gray-300 dark:border-gray-600 hover:border-light-primary-button dark:hover:border-dark-primary-button'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 text-gray-400 dark:text-gray-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-light-text dark:text-dark-text">
              {isDragging ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              or click to browse files
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Accepted formats: {ALLOWED_EXTENSIONS.join(', ')} • Max size: {MAX_FILE_SIZE_MB}MB
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium text-light-text dark:text-dark-text">
            Uploaded Files
          </h3>
          
          {uploadedFiles.map((uploadedFile) => (
            <div
              key={uploadedFile.id}
              className="bg-light-form-field dark:bg-dark-form-field rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {uploadedFile.status === 'uploading' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-light-primary-button dark:bg-dark-primary-button h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadedFile.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {uploadedFile.progress}%
                      </span>
                    </div>
                  )}
                  
                  {uploadedFile.status === 'success' && (
                    <span className="text-green-600 dark:text-green-400 text-sm">
                      ✓ Uploaded
                    </span>
                  )}
                  
                  {uploadedFile.status === 'error' && (
                    <span className="text-red-600 dark:text-red-400 text-sm">
                      ✗ {uploadedFile.error}
                    </span>
                  )}
                  
                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;