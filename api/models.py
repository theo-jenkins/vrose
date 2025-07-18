from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
import uuid

# Sets up custom user manager to use email as username
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)
    
# Custom user model including email and password
class CustomUser(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = None # Remove username field

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        permissions = (
            ("access_none", "Can access none"),
            ("access_all", "Can access all"),
        )

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='customuser_groups',  # Unique related name
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='customuser_user_permissions',  # Unique related name
        blank=True,
    )

    objects = CustomUserManager()

    def __str__(self):
        return self.email
    
# Dashboard feature model
class DashboardFeature(models.Model):
    # Unique identifier for each feature
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Internal reference key ('upload_file')
    key = models.CharField(max_length=100, unique=True)
    # Display name shown to users ('Upload File')
    title = models.CharField(max_length=100)
    # URL path for when a feature is clicked ('/upload-file/')
    route = models.CharField(max_length=100)
    # File name for icon ('upload_file_icon.svg')
    icon = models.CharField(max_length=100, blank=True, null=True)
    # Permission required to access this feature (defined in CustomUser model)
    permission_code = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.title

# Temporary file upload model for staging uploads before user confirmation
class TemporaryUpload(models.Model):
    UPLOAD_STATUS_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('validated', 'Validated'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    original_filename = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)  # Path to temporarily stored file
    file_size = models.BigIntegerField()  # File size in bytes
    file_type = models.CharField(max_length=50)  # csv, xlsx, xls
    status = models.CharField(max_length=20, choices=UPLOAD_STATUS_CHOICES, default='uploaded')
    
    # Preview data (JSON field for storing sample rows)
    preview_data = models.JSONField(null=True, blank=True)
    validation_errors = models.JSONField(null=True, blank=True)  # Store any validation issues
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # 1 hour expiry
    confirmed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.original_filename} - {self.user.email}"

# Processed file upload model for confirmed and processed files
class ProcessedUpload(models.Model):
    PROCESSING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    temporary_upload = models.OneToOneField(TemporaryUpload, on_delete=models.CASCADE, null=True, blank=True)
    
    original_filename = models.CharField(max_length=255)
    processed_file_path = models.CharField(max_length=500)  # Path to processed/stored file
    file_size = models.BigIntegerField()
    file_type = models.CharField(max_length=50)
    
    # Processing metadata
    processing_status = models.CharField(max_length=20, choices=PROCESSING_STATUS_CHOICES, default='pending')
    row_count = models.IntegerField(null=True, blank=True)
    column_count = models.IntegerField(null=True, blank=True)
    processing_errors = models.JSONField(null=True, blank=True)
    
    # Celery task tracking
    celery_task_id = models.CharField(max_length=255, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Processed: {self.original_filename} - {self.user.email}"

# Dynamic user data tables for imported data
class ImportedDataMetadata(models.Model):
    IMPORT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    processed_upload = models.OneToOneField(ProcessedUpload, on_delete=models.CASCADE)
    
    # Table information
    table_name = models.CharField(max_length=255, unique=True)
    display_name = models.CharField(max_length=255)
    
    # Column information
    selected_columns = models.JSONField()  # List of selected column names
    column_mapping = models.JSONField()    # Original column names -> cleaned names mapping
    column_types = models.JSONField()      # Column name -> detected data type mapping
    
    # Import progress tracking
    import_status = models.CharField(max_length=20, choices=IMPORT_STATUS_CHOICES, default='pending')
    total_rows = models.IntegerField(null=True, blank=True)
    processed_rows = models.IntegerField(default=0)
    
    # Task tracking
    celery_task_id = models.CharField(max_length=255, null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.display_name} - {self.user.email}"
    
    @property
    def progress_percentage(self):
        if not self.total_rows or self.total_rows == 0:
            return 0
        return min(100, round((self.processed_rows / self.total_rows) * 100, 1))
    
    def generate_table_name(self):
        """Generate unique table name for this import"""
        import re
        from django.utils import timezone
        
        # Clean filename for use in table name
        clean_filename = re.sub(r'[^a-zA-Z0-9_]', '_', self.processed_upload.original_filename)
        clean_filename = re.sub(r'_+', '_', clean_filename).strip('_')
        
        # Remove file extension
        if '.' in clean_filename:
            clean_filename = clean_filename.rsplit('.', 1)[0]
        
        # Create timestamp
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        
        # Generate table name
        table_name = f"user_{self.user.id}_{clean_filename}_{timestamp}"

        # Replace hyphens
        table_name = table_name.replace('-', '_')
        
        # Ensure it's not too long (PostgreSQL limit is 63 characters)
        if len(table_name) > 60:
            table_name = f"user_{self.user.id}_{timestamp}"
        
        return table_name.lower()

# Track individual import tasks for progress monitoring
class ImportTask(models.Model):
    TASK_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    data_table = models.ForeignKey(ImportedDataMetadata, on_delete=models.CASCADE)
    
    # Task information
    celery_task_id = models.CharField(max_length=255, unique=True)
    task_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=TASK_STATUS_CHOICES, default='pending')
    
    # Progress tracking
    current_step = models.IntegerField(default=0)
    total_steps = models.IntegerField(default=0)
    progress_message = models.CharField(max_length=500, blank=True)
    
    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Error handling
    error_message = models.TextField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.task_name} - {self.status}"
    
    @property
    def progress_percentage(self):
        if not self.total_steps or self.total_steps == 0:
            return 0
        return min(100, round((self.current_step / self.total_steps) * 100, 1))

# Table analysis metadata model for analysis feature
class ImportedDataAnalysisMetadata(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    user_data_table = models.OneToOneField(ImportedDataMetadata, on_delete=models.CASCADE)
    
    # Table metadata
    display_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size = models.BigIntegerField()
    row_count = models.IntegerField()
    
    # Header information
    headers = models.JSONField()  # List of column headers
    
    # Validation status
    is_validated = models.BooleanField(default=False)
    validation_completed_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.display_name} - {self.user.email}"

# Header validation results model
class HeaderValidation(models.Model):
    HEADER_TYPES = [
        ('datetime', 'Datetime'),
        ('product_id', 'Product ID'),
        ('quantity', 'Quantity'),
        ('revenue', 'Revenue'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    table_analysis_metadata = models.ForeignKey(ImportedDataAnalysisMetadata, on_delete=models.CASCADE, related_name='header_validations')
    
    # Header validation details
    header_type = models.CharField(max_length=20, choices=HEADER_TYPES)
    matched_column = models.CharField(max_length=255, null=True, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)  # 0-100
    is_found = models.BooleanField(default=False)
    
    # Validation metadata
    validation_method = models.CharField(max_length=50, default='fuzzy_match')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['table_analysis_metadata', 'header_type']
        ordering = ['header_type']
    
    def __str__(self):
        return f"{self.table_analysis_metadata.display_name} - {self.header_type}: {self.matched_column}"