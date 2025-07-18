# Django Models Documentation

## CustomUser
**Purpose**: Extended Django user model using email as the primary authentication field instead of username.

**Fields**:
- `id`: UUID primary key
- `email`: Unique email address (replaces username)
- `is_staff`, `is_superuser`: Standard Django admin permissions
- `groups`, `user_permissions`: Custom related names to avoid conflicts

**Usage**: Base user model for all application authentication and authorization.

---

## DashboardFeature
**Purpose**: Defines configurable dashboard features/widgets that users can access based on permissions.

**Fields**:
- `id`: UUID primary key
- `key`: Internal reference identifier (e.g., 'upload_file')
- `title`: User-facing display name (e.g., 'Upload File')
- `route`: URL path for feature access (e.g., '/upload-file/')
- `icon`: Optional icon filename for UI display
- `permission_code`: Required permission to access this feature

**Usage**: Controls which features appear on user dashboards based on their permissions.

---

## TemporaryUpload
**Purpose**: Manages the initial file upload stage where files are temporarily stored for user preview and validation before final processing.

**Fields**:
- `id`: UUID primary key
- `user`: Foreign key to CustomUser
- `original_filename`: Original uploaded filename
- `file_path`: Temporary storage path
- `file_size`: File size in bytes
- `file_type`: File format (csv, xlsx, xls)
- `status`: Current upload status (uploaded, validated, confirmed, processing, failed, expired)
- `preview_data`: JSON field storing sample rows for user preview
- `validation_errors`: JSON field storing validation issues
- `created_at`: Upload timestamp
- `expires_at`: Expiry timestamp (1 hour from creation)
- `confirmed_at`: User confirmation timestamp

**Usage**: Initial upload staging with 1-hour expiry mechanism and preview data for user confirmation.

---

## ProcessedUpload
**Purpose**: Represents confirmed uploads that have been processed and permanently stored.

**Fields**:
- `id`: UUID primary key
- `user`: Foreign key to CustomUser
- `temporary_upload`: One-to-one link to TemporaryUpload
- `original_filename`: Original filename
- `processed_file_path`: Permanent storage path
- `file_size`: File size in bytes
- `file_type`: File format
- `processing_status`: Current processing status (pending, processing, completed, failed)
- `row_count`, `column_count`: Data dimensions
- `processing_errors`: JSON field for error details
- `celery_task_id`: Async task identifier
- `created_at`: Creation timestamp
- `processed_at`: Processing completion timestamp

**Usage**: Permanent record of successfully processed uploads with Celery task integration for async processing.

---

## ImportedDataMetadata *(formerly UserDataTable)*
**Purpose**: Stores metadata about dynamic database tables created from imported user data, including column mapping and import progress tracking.

**Fields**:
- `id`: UUID primary key
- `user`: Foreign key to CustomUser
- `processed_upload`: One-to-one link to ProcessedUpload
- `table_name`: Unique database table name
- `display_name`: User-friendly table name
- `selected_columns`: JSON list of selected column names
- `column_mapping`: JSON mapping of original → cleaned column names
- `column_types`: JSON mapping of column → data type
- `import_status`: Current import status (pending, processing, completed, failed, cancelled)
- `total_rows`, `processed_rows`: Progress tracking
- `celery_task_id`: Async task identifier
- `created_at`: Creation timestamp
- `completed_at`: Completion timestamp
- `error_message`: Error details

**Usage**: Manages metadata for dynamically created data tables with column selection, mapping, and import progress tracking.

---

## ImportTask
**Purpose**: Granular tracking of individual import tasks for detailed progress monitoring and error handling.

**Fields**:
- `id`: UUID primary key
- `user`: Foreign key to CustomUser
- `data_table`: Foreign key to ImportedDataMetadata
- `celery_task_id`: Unique Celery task identifier
- `task_name`: Human-readable task description
- `status`: Current task status (pending, running, completed, failed, cancelled)
- `current_step`, `total_steps`: Progress indicators
- `progress_message`: Current operation description
- `created_at`, `started_at`, `completed_at`: Timing information
- `error_message`: Detailed error information
- `retry_count`: Number of retry attempts

**Usage**: Provides step-by-step progress tracking for import operations with retry mechanism and detailed error logging.

---

## ImportedDataAnalysisMetadata *(formerly TableAnalysisMetadata)*
**Purpose**: Stores metadata about imported data tables for analysis features, including validation status and basic table information.

**Fields**:
- `id`: UUID primary key
- `user`: Foreign key to CustomUser
- `user_data_table`: One-to-one link to ImportedDataMetadata
- `display_name`: User-friendly table name
- `file_path`: File storage path
- `file_size`: File size in bytes
- `row_count`: Number of data rows
- `headers`: JSON list of column headers
- `is_validated`: Header validation completion status
- `validation_completed_at`: Validation completion timestamp
- `created_at`, `updated_at`: Metadata timestamps

**Usage**: Foundation for table analysis features with header information storage and validation status tracking.

---

## HeaderValidation
**Purpose**: Stores results of automated header validation to identify standard business data columns (datetime, product_id, quantity, revenue).

**Fields**:
- `id`: UUID primary key
- `table_analysis_metadata`: Foreign key to ImportedDataAnalysisMetadata
- `header_type`: Column type being validated (datetime, product_id, quantity, revenue)
- `matched_column`: Identified column name (if found)
- `confidence_score`: Match confidence (0-100)
- `is_found`: Whether a match was found
- `validation_method`: Validation algorithm used
- `created_at`: Validation timestamp

**Usage**: Enables automated identification of standard business data columns for analysis features using fuzzy matching with confidence scoring.