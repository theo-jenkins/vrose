from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import Permission
from .models import CustomUser, TemporaryUpload, ProcessedUpload, ImportedDataMetadata, ImportTask, ImportedDataAnalysisMetadata, HeaderValidation

# Serializer converting a custom usre model object to JSON
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'is_active']

class SignUpSerializer(serializers.ModelSerializer):
    confirm_email = serializers.CharField(write_only=True)  # Explicitly define confirm_email field
    confirm_password = serializers.CharField(write_only=True)  # Explicitly define confirm_password field

    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'email', 'confirm_email', 'password', 'confirm_password']
        extra_kwargs = {
            'password': {'write_only': True},  # Ensure password is write-only
        }

    def validate(self, data):
        # Validate that email and confirm_email match
        if data.get('email') != data.get('confirm_email'):
            raise serializers.ValidationError("Emails do not match.")
        # Validate that password and confirm_password match
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        # Remove the confirmation fields as they are not part of the model
        validated_data.pop('confirm_email', None)
        validated_data.pop('confirm_password', None)

        email = validated_data['email']
        password = validated_data['password']
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')

        # Create the user
        user = CustomUser.objects.create_user(
            email=email, 
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        # Grant special permissions (temporary for keyword replacement)
        special_permissions = Permission.objects.get(codename='access_all')
        user.user_permissions.add(special_permissions)

        return user
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Call the parent class's validate method to authenticate the user
        data = super().validate(attrs)

        # Include user details in the response
        data['user'] = {
            'id': str(self.user.id),
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
        }
        return data

# File upload serializers
class TemporaryUploadSerializer(serializers.ModelSerializer):
    file_size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = TemporaryUpload
        fields = [
            'id', 'original_filename', 'file_size', 'file_size_mb', 
            'file_type', 'status', 'preview_data', 'validation_errors',
            'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at', 'expires_at']
    
    def get_file_size_mb(self, obj):
        return round(obj.file_size / (1024 * 1024), 2)

class ProcessedUploadSerializer(serializers.ModelSerializer):
    file_size_mb = serializers.SerializerMethodField()
    temporary_upload_id = serializers.SerializerMethodField()
    
    class Meta:
        model = ProcessedUpload
        fields = [
            'id', 'original_filename', 'file_size', 'file_size_mb',
            'file_type', 'processing_status', 'row_count', 'column_count',
            'processing_errors', 'temporary_upload_id', 'created_at', 'processed_at'
        ]
        read_only_fields = ['id', 'created_at', 'processed_at']
    
    def get_file_size_mb(self, obj):
        return round(obj.file_size / (1024 * 1024), 2)
    
    def get_temporary_upload_id(self, obj):
        return str(obj.temporary_upload.id) if obj.temporary_upload else None

# Column Selection Serializers
class ColumnSelectionRequestSerializer(serializers.Serializer):
    selected_columns = serializers.ListField(
        child=serializers.CharField(),
        min_length=1,
        help_text="List of column names to import"
    )
    
    def validate_selected_columns(self, value):
        if not value:
            raise serializers.ValidationError("At least one column must be selected")
        return value

class ColumnSelectionResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    task_id = serializers.UUIDField()
    table_name = serializers.CharField()
    total_rows = serializers.IntegerField()
    selected_columns = serializers.IntegerField()
    message = serializers.CharField()

# Dynamic Table Serializers
class ImportedDataMetadataSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()
    file_size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = ImportedDataMetadata
        fields = [
            'id', 'table_name', 'display_name', 'selected_columns',
            'column_mapping', 'column_types', 'import_status',
            'total_rows', 'processed_rows', 'progress_percentage',
            'created_at', 'completed_at', 'error_message', 'file_size_mb'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at', 'progress_percentage']
    
    def get_file_size_mb(self, obj):
        if obj.processed_upload:
            return round(obj.processed_upload.file_size / (1024 * 1024), 2)
        return 0

class ImportProgressSerializer(serializers.Serializer):
    task_id = serializers.UUIDField()
    status = serializers.CharField()
    current = serializers.IntegerField()
    total = serializers.IntegerField()
    percentage = serializers.FloatField()
    message = serializers.CharField()
    table_name = serializers.CharField()
    error_message = serializers.CharField(allow_null=True)

class ImportTaskSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = ImportTask
        fields = [
            'id', 'task_name', 'status', 'current_step', 'total_steps',
            'progress_percentage', 'progress_message', 'created_at',
            'started_at', 'completed_at', 'error_message', 'retry_count'
        ]
        read_only_fields = ['id', 'created_at', 'started_at', 'completed_at', 'progress_percentage']

# Analyse Data Feature Serializers
class HeaderValidationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeaderValidation
        fields = [
            'id', 'header_type', 'matched_column', 'confidence_score',
            'is_found', 'validation_method', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class ImportedDataAnalysisMetadataSerializer(serializers.ModelSerializer):
    header_validations = HeaderValidationSerializer(many=True, read_only=True)
    file_size_mb = serializers.SerializerMethodField()
    validation_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = ImportedDataAnalysisMetadata
        fields = [
            'id', 'display_name', 'file_path', 'file_size', 'file_size_mb',
            'row_count', 'headers', 'is_validated', 'validation_completed_at',
            'created_at', 'updated_at', 'header_validations', 'validation_summary'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_file_size_mb(self, obj):
        return round(obj.file_size / (1024 * 1024), 2)
    
    def get_validation_summary(self, obj):
        if not obj.is_validated:
            return None
        
        validations = obj.header_validations.all()
        found_count = validations.filter(is_found=True).count()
        total_count = validations.count()
        
        return {
            'all_found': found_count == 4,  # We need 4 header types
            'found_count': found_count,
            'total_count': total_count,
            'can_generate_insights': found_count == 4,
            'missing_headers': [
                v.header_type for v in validations.filter(is_found=False)
            ]
        }

class ImportedDataAnalysisMetadataListSerializer(serializers.ModelSerializer):
    file_size_mb = serializers.SerializerMethodField()
    validation_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = ImportedDataAnalysisMetadata
        fields = [
            'id', 'display_name', 'file_size_mb', 'row_count',
            'is_validated', 'validation_completed_at', 'created_at',
            'validation_summary'
        ]
    
    def get_file_size_mb(self, obj):
        return round(obj.file_size / (1024 * 1024), 2)
    
    def get_validation_summary(self, obj):
        if not obj.is_validated:
            return None
        
        validations = obj.header_validations.all()
        found_count = validations.filter(is_found=True).count()
        
        return {
            'all_found': found_count == 4,
            'found_count': found_count,
            'can_generate_insights': found_count == 4
        }

class HeaderValidationRequestSerializer(serializers.Serializer):
    force_revalidate = serializers.BooleanField(default=False)

class HeaderValidationResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    validation_results = serializers.DictField()
    validation_summary = serializers.DictField()