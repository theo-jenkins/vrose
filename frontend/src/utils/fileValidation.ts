// File validation utilities for frontend

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  file?: File;
}

// Validation constants
export const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
export const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel' // xls
];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
export const MAX_FILE_SIZE_MB = 50;

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(extension);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Validate file MIME type
 */
export function validateFileMimeType(file: File): boolean {
  return ALLOWED_MIME_TYPES.includes(file.type);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Comprehensive file validation
 */
export function validateFile(file: File): FileValidationResult {
  const errors: string[] = [];
  
  // Check if file exists
  if (!file) {
    errors.push('No file selected');
    return { isValid: false, errors };
  }
  
  // Validate file extension
  if (!validateFileExtension(file.name)) {
    errors.push(`Invalid file type. Accepted formats: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }
  
  // Validate file size
  if (!validateFileSize(file)) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB`);
  }
  
  // Validate MIME type
  if (!validateFileMimeType(file)) {
    errors.push(`Invalid file content type: ${file.type}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    file
  };
}

/**
 * Validate multiple files
 */
export function validateFiles(files: FileList | File[]): FileValidationResult[] {
  const results: FileValidationResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files instanceof FileList ? files[i] : files[i];
    results.push(validateFile(file));
  }
  
  return results;
}

/**
 * Check if drag event contains valid files
 */
export function validateDraggedFiles(dataTransfer: DataTransfer): FileValidationResult[] {
  const files = Array.from(dataTransfer.files);
  return validateFiles(files);
}