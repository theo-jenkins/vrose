import os
import uuid
import pandas as pd
import magic
import numpy as np
from datetime import datetime, timedelta
from django.conf import settings
from django.core.files.storage import default_storage
from django.utils import timezone

# File validation constants
ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls'}
ALLOWED_MIME_TYPES = {
    'text/csv',
    'application/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # xlsx
    'application/vnd.ms-excel',  # xls
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB in bytes

class FileValidationError(Exception):
    """Custom exception for file validation errors"""
    pass

def validate_file_extension(filename):
    """Validate file has allowed extension"""
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise FileValidationError(
            f"File type {ext} not allowed. Accepted formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    return ext

def validate_file_size(file_obj):
    """Validate file size is within limits"""
    file_size = file_obj.size
    if file_size > MAX_FILE_SIZE:
        raise FileValidationError(
            f"File size {file_size / (1024*1024):.1f}MB exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
        )
    return file_size

def validate_file_content(file_path):
    """Validate file content using python-magic"""
    try:
        # Get MIME type
        mime_type = magic.from_file(file_path, mime=True)
        if mime_type not in ALLOWED_MIME_TYPES:
            raise FileValidationError(f"Invalid file content. Detected MIME type: {mime_type}")
        return mime_type
    except Exception as e:
        raise FileValidationError(f"Could not validate file content: {str(e)}")

def generate_unique_filename(original_filename):
    """Generate unique filename to prevent conflicts"""
    name, ext = os.path.splitext(original_filename)
    unique_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{name}_{timestamp}_{unique_id}{ext}"

def convert_timestamps_to_strings(data):
    """Convert pandas Timestamp objects to strings for JSON serialization"""
    if isinstance(data, dict):
        return {key: convert_timestamps_to_strings(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_timestamps_to_strings(item) for item in data]
    elif isinstance(data, pd.Timestamp):
        # Convert pandas Timestamp to string
        return data.strftime('%Y-%m-%d %H:%M:%S') if pd.notna(data) else None
    elif data is pd.NaT:
        # Handle pandas NaT (Not a Time) values
        return None
    elif pd.isna(data):
        # Handle other pandas NA values
        return None
    elif isinstance(data, (np.integer, np.floating)):
        # Handle numpy numbers
        return data.item()
    elif hasattr(data, 'date') and callable(getattr(data, 'date')):
        # Handle datetime.date objects
        return data.strftime('%Y-%m-%d %H:%M:%S') if hasattr(data, 'strftime') else str(data)
    else:
        return data

def save_temporary_file(file_obj, user_id):
    """Save uploaded file to temporary storage"""
    # Create temp directory structure
    temp_dir = f"temp_uploads/{user_id}/{datetime.now().strftime('%Y/%m/%d')}"
    os.makedirs(os.path.join(settings.MEDIA_ROOT, temp_dir), exist_ok=True)
    
    # Generate unique filename
    unique_filename = generate_unique_filename(file_obj.name)
    file_path = os.path.join(temp_dir, unique_filename)
    full_path = os.path.join(settings.MEDIA_ROOT, file_path)
    
    # Save file
    with open(full_path, 'wb+') as destination:
        for chunk in file_obj.chunks():
            destination.write(chunk)
    
    return file_path, full_path

def generate_file_preview(file_path, file_type):
    """Generate preview data from uploaded file"""
    try:
        if file_type == '.csv':
            df = pd.read_csv(file_path, nrows=5)  # Read first 5 rows
        elif file_type in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path, nrows=5)  # Read first 5 rows
        else:
            raise FileValidationError(f"Unsupported file type for preview: {file_type}")
        
        # Convert to dict for JSON serialization
        rows_data = df.to_dict('records')
        
        # Convert any pandas Timestamp objects to strings for JSON serialization
        rows_data = convert_timestamps_to_strings(rows_data)
        
        preview_data = {
            'columns': df.columns.tolist(),
            'rows': rows_data,
            'total_rows_sample': len(df),
            'total_columns': len(df.columns)
        }
        
        return preview_data
    except Exception as e:
        raise FileValidationError(f"Could not generate preview: {str(e)}")

def validate_file_structure(file_path, file_type):
    """Validate file has proper structure (headers, data)"""
    validation_errors = []
    
    try:
        if file_type == '.csv':
            df = pd.read_csv(file_path, nrows=10)
        elif file_type in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path, nrows=10)
        else:
            raise FileValidationError(f"Unsupported file type: {file_type}")
        
        # Check if file is empty
        if df.empty:
            validation_errors.append("File appears to be empty")
        
        # Check for unnamed columns (common issue)
        unnamed_cols = [col for col in df.columns if 'Unnamed:' in str(col)]
        if unnamed_cols:
            validation_errors.append(f"File contains unnamed columns: {unnamed_cols}")
        
        # Check for completely empty columns
        empty_cols = df.columns[df.isnull().all()].tolist()
        if empty_cols:
            validation_errors.append(f"File contains completely empty columns: {empty_cols}")
        
        return validation_errors
    
    except Exception as e:
        validation_errors.append(f"Could not validate file structure: {str(e)}")
        return validation_errors

def cleanup_expired_files():
    """Clean up expired temporary files (to be run as periodic task)"""
    from ..models import TemporaryUpload
    
    # Find expired uploads
    expired_uploads = TemporaryUpload.objects.filter(
        expires_at__lt=timezone.now(),
        status__in=['uploaded', 'validated', 'failed']
    )
    
    cleaned_count = 0
    for upload in expired_uploads:
        try:
            # Delete physical file
            full_path = os.path.join(settings.MEDIA_ROOT, upload.file_path)
            if os.path.exists(full_path):
                os.remove(full_path)
            
            # Update status
            upload.status = 'expired'
            upload.save()
            cleaned_count += 1
        except Exception as e:
            print(f"Error cleaning up file {upload.file_path}: {str(e)}")
    
    return cleaned_count

def calculate_expiry_time():
    """Calculate expiry time (1 hour from now)"""
    return timezone.now() + timedelta(hours=1)