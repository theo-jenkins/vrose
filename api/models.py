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
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False) # Unique identifier for each feature
    key = models.CharField(max_length=100, unique=True) # Internal reference key ('upload_file')
    title = models.CharField(max_length=100) # Display name shown to users ('Upload File')
    route = models.CharField(max_length=100) # URL path for when a feature is clicked ('/upload-file/')
    icon = models.CharField(max_length=100, blank=True, null=True) # File name for icon ('upload_file_icon.svg')
    permission_code = models.CharField(max_length=100, blank=True, null=True) # Permission required to access this feature (defined in CustomUser model)

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
    # Metadata
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
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # 1 hour expiry
    confirmed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.original_filename} - {self.user.email}"

# Core asset for users datasets, consolidated model combining legacy ProcessedUpload and ImportedDataMetadata models
class UserDataset(models.Model):
    STATUS_CHOICES = [
        ('importing', 'Importing'),
        ('active', 'Active'),
        ('failed', 'Failed'),
        ('archived', 'Archived'),
    ]
    
    # Identity fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    temporary_upload = models.OneToOneField(TemporaryUpload, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Dataset Information (user-facing)
    name = models.CharField(max_length=255)  # User-friendly dataset name
    original_filename = models.CharField(max_length=255)  # From original upload
    
    # Table Management
    table_name = models.CharField(max_length=255, unique=True)  # Database table name
    selected_columns = models.JSONField()  # List of selected column names
    column_mapping = models.JSONField()  # Original → cleaned column name mapping
    column_types = models.JSONField()  # Column → data type mapping
    
    # Data Metrics
    total_rows = models.IntegerField(null=True, blank=True)
    file_size = models.BigIntegerField()
    file_type = models.CharField(max_length=50)  # csv, xlsx, xls
    
    # Status & Progress
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='importing')
    
    # Task Tracking
    celery_task_id = models.CharField(max_length=255, null=True, blank=True)
    error_details = models.JSONField(null=True, blank=True)  # Detailed error information
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    imported_at = models.DateTimeField(null=True, blank=True)  # When import completed
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['table_name']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.user.email}"
    
    def generate_table_name(self):
        """Generate unique table name for this dataset"""
        import re
        from django.utils import timezone
        
        # Clean filename for use in table name
        clean_filename = re.sub(r'[^a-zA-Z0-9_]', '_', self.original_filename)
        clean_filename = re.sub(r'_+', '_', clean_filename).strip('_')
        
        # Remove file extension
        if '.' in clean_filename:
            clean_filename = clean_filename.rsplit('.', 1)[0]
        
        # Create timestamp
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        
        # Generate table name
        table_name = f"user_{str(self.user.id)}_{clean_filename}_{timestamp}"

        # Replace hyphens
        table_name = table_name.replace('-', '_')
        
        # Ensure it's not too long (PostgreSQL limit is 63 characters)
        if len(table_name) > 60:
            table_name = f"user_{str(self.user.id)}_{timestamp}"
        
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
    dataset = models.ForeignKey(UserDataset, on_delete=models.CASCADE, related_name='import_tasks')
    
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


# Dataset analysis metadata model for analysis feature
class DatasetAnalysisMetadata(models.Model):
    # Core relationship
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dataset = models.OneToOneField(UserDataset, on_delete=models.CASCADE, related_name='analysis')
    
    # Analysis readiness
    is_analysis_ready = models.BooleanField(default=False)
    analysis_validated_at = models.DateTimeField(null=True, blank=True)
    
    # Header validation results
    required_columns_found = models.JSONField(default=dict)
    optional_columns_found = models.JSONField(default=dict)
    
    # Analysis tracking
    insights_generated = models.BooleanField(default=False)
    last_analysis_run = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Analysis: {self.dataset.name}"

# Header validation results model
class HeaderValidation(models.Model):
    HEADER_TYPES = [
        ('datetime', 'Datetime'),
        ('product_id', 'Product ID'),
        ('quantity', 'Quantity'),
        ('revenue', 'Revenue'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dataset_analysis = models.ForeignKey(DatasetAnalysisMetadata, on_delete=models.CASCADE, related_name='header_validations')
    
    # Header validation details
    header_type = models.CharField(max_length=20, choices=HEADER_TYPES)
    matched_column = models.CharField(max_length=255, null=True, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)  # 0-100
    is_found = models.BooleanField(default=False)
    
    # Validation metadata
    validation_method = models.CharField(max_length=50, default='fuzzy_match')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['dataset_analysis', 'header_type']
        ordering = ['header_type']
    
    def __str__(self):
        return f"{self.dataset_analysis.dataset.name} - {self.header_type}: {self.matched_column}"