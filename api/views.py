import json
import os
import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.http import JsonResponse
from django.middleware.csrf import get_token

logger = logging.getLogger(__name__)
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from google.oauth2 import id_token
from google.auth.transport import requests
from .serializers import SignUpSerializer, CustomTokenObtainPairSerializer
from .models import CustomUser, DashboardFeature, ImportedDataAnalysisMetadata


# API endpoint for fetching CSRF token
@ensure_csrf_cookie
def get_csrf_token(request):
    get_token(request)
    return JsonResponse({"detail": "CSRF token set"}, status=200)

# API endpoint for user sign up (token creation)
@method_decorator(csrf_protect, name='dispatch')
class SignUpView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        # Passes the form data to the serializer
        serializer = SignUpSerializer(data=request.data)
        # Attempts to validate the serializer then saves the user
        if serializer.is_valid():
            user=serializer.save()

            # Generate a new refresh token for the user
            refresh = RefreshToken.for_user(user)
            data = {
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }

            # Set tokens in cookies
            response = Response(data, status=status.HTTP_201_CREATED)

            response.set_cookie(
                key='access_token',
                value=str(refresh.access_token),
                httponly=True,
                secure=False,  # Use True for production
                samesite='Lax'
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=False, # Use True for production
                samesite='Lax'
            )
            return response
        
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
# API endpoint for user sign in (token issuance)
@method_decorator(csrf_protect, name='dispatch')
class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == status.HTTP_200_OK:
            refresh = response.data.get('refresh')
            access = response.data.get('access')

            # Set cookies
            response.set_cookie(
                key='access_token',
                value=access,
                httponly=True,
                secure=False, # Set to true for production
                samesite='Lax'
            )
            response.set_cookie(
                key='refresh_token',
                value=refresh,
                httponly=True,
                secure=False, # Set to true for production
                samesite='Lax'
            )

        return response
    
# Log out endpoint
@method_decorator(csrf_protect, name='dispatch')
class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Extract the refresh token from the cookies
            refresh_token = request.COOKIES.get('refresh_token')
            
            # Clear the cookies on the client side
            response = Response({"success": True, "message": "User logged out successfully"}, status=200)
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')

            # Invalidate the refresh token
            if refresh_token:
                try:
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                except Exception as e:
                    pass

            return response
        except Exception as e:
            return Response({"success": False, "message": "Invalid token"}, status=400)


# Refresh token endpoint
class TokenRefreshView(TokenRefreshView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({"success": False, "message": "Refresh token is required"}, status=401)
        
        try:
            refresh = RefreshToken(refresh_token)
            return Response({"access": str(refresh.access_token)})
        except Exception:
            return Response({"message": "Invalid refresh token"}, status=401)

# API endpoint for users email and permissions
class UserDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        permissions = user.get_all_permissions()
        response = {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "permissions": list(permissions)
        }
        return Response(response)
    
# API endpoint for fetching dashboard features
class DashboardFeaturesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        features_qs = DashboardFeature.objects.all()
        features_list = []
        
        for feature in features_qs:
            if not feature.permission_code: # If no permission code is set, assume user has access
                enabled = True
            else:
                enabled = user.has_perm(f'{feature._meta.app_label}.{feature.permission_code}')
            
            features_list.append({
                'key': feature.key,
                'title': feature.title,
                'route': feature.route,
                'icon': feature.icon,
                'enabled': enabled,
            })

        return Response({"features": features_list}, status=200)

@method_decorator(csrf_protect, name='dispatch')
class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        credential = request.data.get('credential')

        if not credential:
            return Response(
                {"success": False, "error": "Credential is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get Google Client ID from environment
            google_client_id = os.getenv('NEXT_PUBLIC_GOOGLE_CLIENT_ID')
            if not google_client_id:
                return Response(
                    {"success": False, "error": "Google OAuth not configured"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Validate the Google ID token
            id_info = id_token.verify_oauth2_token(
                credential,
                requests.Request(),
                google_client_id
            )

            # Extract user data
            email = id_info.get('email')
            name = id_info.get('name', '')
            given_name = id_info.get('given_name', '')
            family_name = id_info.get('family_name', '')

            if not email:
                return Response(
                    {"success": False, "error": "Email not provided by Google"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create or get user
            user, created = CustomUser.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': given_name,
                    'last_name': family_name,
                    'is_active': True,
                }
            )

            # Update user info if account already exists
            if not created:
                user.first_name = given_name or user.first_name
                user.last_name = family_name or user.last_name
                user.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            # Response data
            response_data = {
                "success": True,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "name": f"{user.first_name} {user.last_name}".strip(),
                },
                "access": access_token,
                "refresh": str(refresh),
                "created": created
            }

            # Set HTTP-only cookies
            response = Response(response_data, status=status.HTTP_200_OK)
            
            # Cookie settings based on environment
            from django.conf import settings
            is_secure = not settings.DEBUG
            
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=is_secure,
                samesite='Lax',
                max_age=5 * 60,  # 5 minutes (match JWT settings)
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=is_secure,
                samesite='Lax',
                max_age=24 * 60 * 60,  # 1 day (match JWT settings)
            )

            return response

        except ValueError as e:
            return Response(
                {"success": False, "error": "Invalid Google token"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {"success": False, "error": "Authentication failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# File Upload Views
class TemporaryFileUploadView(APIView):
    """Handle temporary file uploads with validation and preview generation"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from .utils.file_handlers import (
            validate_file_extension, validate_file_size, validate_file_content,
            save_temporary_file, generate_file_preview, validate_file_structure,
            calculate_expiry_time, FileValidationError
        )
        from .models import TemporaryUpload
        from .serializers import TemporaryUploadSerializer
        
        try:
            # Check if file was uploaded
            if 'file' not in request.FILES:
                return Response(
                    {"error": "No file provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            file_obj = request.FILES['file']
            
            # Validate file extension
            file_type = validate_file_extension(file_obj.name)
            
            # Validate file size
            file_size = validate_file_size(file_obj)
            
            # Save file temporarily
            file_path, full_path = save_temporary_file(file_obj, request.user.id)
            
            # Validate file content
            mime_type = validate_file_content(full_path)
            
            # Generate preview data
            preview_data = generate_file_preview(full_path, file_type)
            
            # Validate file structure
            validation_errors = validate_file_structure(full_path, file_type)
            
            # Create temporary upload record
            temp_upload = TemporaryUpload.objects.create(
                user=request.user,
                original_filename=file_obj.name,
                file_path=file_path,
                file_size=file_size,
                file_type=file_type,
                status='validated' if not validation_errors else 'uploaded',
                preview_data=preview_data,
                validation_errors=validation_errors if validation_errors else None,
                expires_at=calculate_expiry_time()
            )
            
            # Serialize response
            serializer = TemporaryUploadSerializer(temp_upload)
            
            return Response({
                "success": True,
                "upload": serializer.data,
                "message": "File uploaded and validated successfully"
            }, status=status.HTTP_201_CREATED)
            
        except FileValidationError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Upload failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ConfirmUploadView(APIView):
    """Confirm temporary upload and move to processing queue"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, temp_id):
        from .models import TemporaryUpload, ProcessedUpload
        from .serializers import ProcessedUploadSerializer
        from django.utils import timezone
        
        try:
            # Get temporary upload
            temp_upload = TemporaryUpload.objects.get(
                id=temp_id,
                user=request.user,
                status__in=['uploaded', 'validated']
            )
            
            # Check if not expired
            if temp_upload.expires_at < timezone.now():
                return Response(
                    {"error": "Upload has expired"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update temporary upload status
            temp_upload.status = 'confirmed'
            temp_upload.confirmed_at = timezone.now()
            temp_upload.save()
            
            # Create processed upload record
            processed_upload = ProcessedUpload.objects.create(
                user=request.user,
                temporary_upload=temp_upload,
                original_filename=temp_upload.original_filename,
                processed_file_path=temp_upload.file_path,  # Will be updated after processing
                file_size=temp_upload.file_size,
                file_type=temp_upload.file_type,
                processing_status='pending'
            )
            
            # TODO: Queue Celery task for background processing
            # processed_upload.celery_task_id = process_file_task.delay(processed_upload.id).id
            # processed_upload.save()
            
            serializer = ProcessedUploadSerializer(processed_upload)
            
            return Response({
                "success": True,
                "upload": serializer.data,
                "message": "Upload confirmed and queued for processing"
            }, status=status.HTTP_200_OK)
            
        except TemporaryUpload.DoesNotExist:
            return Response(
                {"error": "Upload not found or already processed"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Confirmation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DiscardUploadView(APIView):
    """Discard temporary upload and clean up files"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, temp_id):
        import os
        from django.conf import settings
        from .models import TemporaryUpload
        
        try:
            # Get temporary upload
            temp_upload = TemporaryUpload.objects.get(
                id=temp_id,
                user=request.user
            )
            
            # Delete physical file
            full_path = os.path.join(settings.MEDIA_ROOT, temp_upload.file_path)
            if os.path.exists(full_path):
                os.remove(full_path)
            
            # Delete database record
            temp_upload.delete()
            
            return Response({
                "success": True,
                "message": "Upload discarded successfully"
            }, status=status.HTTP_200_OK)
            
        except TemporaryUpload.DoesNotExist:
            return Response(
                {"error": "Upload not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to discard upload: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserUploadsView(APIView):
    """Get user's upload history and status"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .models import ProcessedUpload
        from .serializers import ProcessedUploadSerializer
        
        # Get user's processed uploads
        uploads = ProcessedUpload.objects.filter(
            user=request.user
        ).order_by('-created_at')
        
        serializer = ProcessedUploadSerializer(uploads, many=True)
        
        return Response({
            "uploads": serializer.data
        }, status=status.HTTP_200_OK)

class ColumnSelectionView(APIView):
    """Handle column selection and start data import process"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, temp_id):
        from .models import TemporaryUpload, ProcessedUpload, ImportedDataMetadata
        from .serializers import ColumnSelectionRequestSerializer, ColumnSelectionResponseSerializer
        from .utils.dynamic_tables import analyze_file_for_import, DynamicTableManager
        from django.utils import timezone
        from django.conf import settings
        import os
        
        # Validate request data
        request_serializer = ColumnSelectionRequestSerializer(data=request.data)
        if not request_serializer.is_valid():
            return Response(request_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get temporary upload
            temp_upload = TemporaryUpload.objects.get(
                id=temp_id,
                user=request.user,
                status__in=['uploaded', 'validated']
            )
            
            # Check if not expired
            if temp_upload.expires_at < timezone.now():
                return Response(
                    {"error": "Upload has expired"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            selected_columns = request_serializer.validated_data['selected_columns']
            
            # Validate selected columns exist in preview data
            if temp_upload.preview_data and temp_upload.preview_data.get('columns'):
                available_columns = temp_upload.preview_data['columns']
                invalid_columns = [col for col in selected_columns if col not in available_columns]
                if invalid_columns:
                    return Response(
                        {"error": f"Invalid columns selected: {invalid_columns}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Analyze file for import
            file_full_path = os.path.join(settings.MEDIA_ROOT, temp_upload.file_path)
            analysis = analyze_file_for_import(file_full_path, selected_columns)
            
            if not analysis['success']:
                return Response(
                    {"error": f"File analysis failed: {analysis['error']}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Update temporary upload status
            temp_upload.status = 'confirmed'
            temp_upload.confirmed_at = timezone.now()
            temp_upload.save()
            
            # Create or get processed upload record
            processed_upload, created = ProcessedUpload.objects.get_or_create(
                temporary_upload=temp_upload,
                defaults={
                    'user': request.user,
                    'original_filename': temp_upload.original_filename,
                    'processed_file_path': temp_upload.file_path,
                    'file_size': temp_upload.file_size,
                    'file_type': temp_upload.file_type,
                    'processing_status': 'pending',
                    'row_count': analysis['total_rows'],
                    'column_count': len(selected_columns)
                }
            )
            
            # Create ImportedDataMetadata record
            data_table = ImportedDataMetadata.objects.create(
                user=request.user,
                processed_upload=processed_upload,
                table_name='',  # Will be set after generation
                display_name=temp_upload.original_filename,
                selected_columns=selected_columns,
                column_mapping=analysis['column_mapping'],
                column_types=analysis['column_types'],
                total_rows=analysis['total_rows'],
                import_status='pending'
            )
            
            # Generate unique table name
            table_name = data_table.generate_table_name()
            
            # Ensure table name is unique
            counter = 1
            original_table_name = table_name
            while ImportedDataMetadata.objects.filter(table_name=table_name).exists():
                table_name = f"{original_table_name}_{counter}"
                counter += 1
            
            data_table.table_name = table_name
            data_table.save()
            
            # Create the database table
            table_created = DynamicTableManager.create_table(
                table_name,
                analysis['column_types']
            )
            
            if not table_created:
                data_table.import_status = 'failed'
                data_table.error_message = 'Failed to create database table'
                data_table.save()
                
                return Response(
                    {"error": "Failed to create database table"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Queue Celery task for data import
            from .tasks import import_data_task
            
            # Start the import task
            task_result = import_data_task.delay(str(data_table.id))
            data_table.celery_task_id = task_result.id
            data_table.save()
            
            processed_upload.processing_status = 'processing'
            processed_upload.celery_task_id = task_result.id
            processed_upload.save()
            
            response_data = {
                "success": True,
                "task_id": data_table.id,
                "table_name": table_name,
                "total_rows": analysis['total_rows'],
                "selected_columns": len(selected_columns),
                "message": "Import started successfully"
            }
            
            response_serializer = ColumnSelectionResponseSerializer(response_data)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
            
        except TemporaryUpload.DoesNotExist:
            return Response(
                {"error": "Upload not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Import failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ImportProgressView(APIView):
    """Get progress information for data import"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, task_id):
        from .models import ImportedDataMetadata
        from .serializers import ImportProgressSerializer
        
        try:
            data_table = ImportedDataMetadata.objects.get(
                id=task_id,
                user=request.user
            )
            
            progress_data = {
                "task_id": data_table.id,
                "status": data_table.import_status,
                "current": data_table.processed_rows,
                "total": data_table.total_rows,
                "percentage": data_table.progress_percentage,
                "message": self._get_progress_message(data_table),
                "table_name": data_table.table_name,
                "error_message": data_table.error_message
            }
            
            serializer = ImportProgressSerializer(progress_data)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except ImportedDataMetadata.DoesNotExist:
            return Response(
                {"error": "Import task not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to get progress: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_progress_message(self, data_table):
        """Generate human-readable progress message"""
        if data_table.import_status == 'pending':
            return "Import queued, waiting to start..."
        elif data_table.import_status == 'processing':
            if data_table.total_rows:
                return f"Importing row {data_table.processed_rows} of {data_table.total_rows}"
            else:
                return "Processing data..."
        elif data_table.import_status == 'completed':
            return f"Import completed! {data_table.processed_rows} rows imported."
        elif data_table.import_status == 'failed':
            return f"Import failed: {data_table.error_message or 'Unknown error'}"
        elif data_table.import_status == 'cancelled':
            return "Import was cancelled"
        else:
            return "Unknown status"

class ImportedDataMetadataView(APIView):
    """Get user's imported data tables"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .models import ImportedDataMetadata
        from .serializers import ImportedDataMetadataSerializer
        
        # Get user's data tables
        data_tables = ImportedDataMetadata.objects.filter(
            user=request.user
        ).order_by('-created_at')
        
        serializer = ImportedDataMetadataSerializer(data_tables, many=True)
        
        return Response({
            "data_tables": serializer.data
        }, status=status.HTTP_200_OK)

# Analyse Data Feature Views
class AnalyseDataView(APIView):
    """List user's table analysis metadata for analysis"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .models import ImportedDataAnalysisMetadata, ImportedDataMetadata
        from .serializers import ImportedDataAnalysisMetadataListSerializer
        
        logger.info(f"User {request.user.email} requesting analyse data tables")
        
        # Get user's completed data tables
        completed_data_tables = ImportedDataMetadata.objects.filter(
            user=request.user,
            import_status='completed'
        ).select_related('processed_upload')
        
        logger.info(f"Found {completed_data_tables.count()} completed data tables for user {request.user.email}")
        
        # Create ImportedDataAnalysisMetadata records for any that don't exist
        created_count = 0
        for data_table in completed_data_tables:
            analysis_metadata, created = ImportedDataAnalysisMetadata.objects.get_or_create(
                user_data_table=data_table,
                defaults={
                    'user': request.user,
                    'display_name': data_table.display_name,
                    'file_path': data_table.processed_upload.processed_file_path,
                    'file_size': data_table.processed_upload.file_size,
                    'row_count': data_table.total_rows or 0,
                    'headers': data_table.selected_columns
                }
            )
            if created:
                created_count += 1
                logger.info(f"Created ImportedDataAnalysisMetadata for ImportedDataMetadata {data_table.id}")
        
        logger.info(f"Created {created_count} new ImportedDataAnalysisMetadata records")
        
        # Get user's analysis metadata
        analysis_metadata = ImportedDataAnalysisMetadata.objects.filter(
            user=request.user
        ).select_related('user_data_table').prefetch_related('header_validations')
        
        logger.info(f"Returning {analysis_metadata.count()} analysis metadata records")
        
        serializer = ImportedDataAnalysisMetadataListSerializer(analysis_metadata, many=True)
        
        return Response({
            "saved_tables": serializer.data,
            "total_count": analysis_metadata.count()
        }, status=status.HTTP_200_OK)

class ImportedDataAnalysisMetadataDetailView(APIView):
    """Get detailed information about table analysis metadata"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, table_id):
        from .models import ImportedDataAnalysisMetadata
        from .serializers import ImportedDataAnalysisMetadataSerializer
        
        try:
            analysis_metadata = ImportedDataAnalysisMetadata.objects.get(
                id=table_id,
                user=request.user
            )
            
            serializer = ImportedDataAnalysisMetadataSerializer(analysis_metadata)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except ImportedDataAnalysisMetadata.DoesNotExist:
            return Response(
                {"error": "Table analysis metadata not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class ImportedDataAnalysisMetadataDeleteView(APIView):
    """Delete table analysis metadata and associated user data table"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, table_id):
        from .models import ImportedDataAnalysisMetadata
        from django.db import transaction
        
        try:
            analysis_metadata = ImportedDataAnalysisMetadata.objects.get(
                id=table_id,
                user=request.user
            )
            
            table_name = analysis_metadata.display_name
            user_data_table = analysis_metadata.user_data_table
            
            # Delete both metadata and user data table in a transaction
            with transaction.atomic():
                analysis_metadata.delete()
                user_data_table.delete()
            
            return Response({
                "message": f"Table '{table_name}' and all associated data deleted successfully"
            }, status=status.HTTP_200_OK)
            
        except ImportedDataAnalysisMetadata.DoesNotExist:
            return Response(
                {"error": "Table analysis metadata not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class HeaderValidationView(APIView):
    """Validate headers for a saved table"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, table_id):
        from .models import ImportedDataAnalysisMetadata, HeaderValidation
        from .serializers import HeaderValidationRequestSerializer, HeaderValidationResponseSerializer
        from .services.header_validator import HeaderValidator
        from django.utils import timezone
        import pandas as pd
        
        try:
            analysis_metadata = ImportedDataAnalysisMetadata.objects.get(
                id=table_id,
                user=request.user
            )
            
            serializer = HeaderValidationRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            force_revalidate = serializer.validated_data.get('force_revalidate', False)
            
            # Check if already validated and not forcing revalidation
            if analysis_metadata.is_validated and not force_revalidate:
                return Response({
                    "success": True,
                    "message": "Headers already validated",
                    "validation_results": self._get_existing_validation_results(analysis_metadata),
                    "validation_summary": self._get_validation_summary(analysis_metadata)
                }, status=status.HTTP_200_OK)
            
            # Perform header validation
            validator = HeaderValidator()
            headers = analysis_metadata.headers
            
            validation_results = validator.validate_headers(headers)
            validation_summary = validator.get_validation_summary(validation_results)
            
            # Clear existing validations if revalidating
            if force_revalidate:
                analysis_metadata.header_validations.all().delete()
            
            # Save validation results
            for header_type, result in validation_results.items():
                HeaderValidation.objects.update_or_create(
                    table_analysis_metadata=analysis_metadata,
                    header_type=header_type,
                    defaults={
                        'matched_column': result['matched_column'],
                        'confidence_score': result['confidence_score'],
                        'is_found': result['is_found'],
                        'validation_method': result['validation_method']
                    }
                )
            
            # Update analysis metadata validation status
            analysis_metadata.is_validated = True
            analysis_metadata.validation_completed_at = timezone.now()
            analysis_metadata.save()
            
            return Response({
                "success": True,
                "message": "Header validation completed",
                "validation_results": validation_results,
                "validation_summary": validation_summary
            }, status=status.HTTP_200_OK)
            
        except ImportedDataAnalysisMetadata.DoesNotExist:
            return Response(
                {"error": "Table analysis metadata not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Validation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_existing_validation_results(self, analysis_metadata):
        """Get existing validation results for a table"""
        results = {}
        validations = analysis_metadata.header_validations.all()
        
        for validation in validations:
            results[validation.header_type] = {
                'matched_column': validation.matched_column,
                'confidence_score': validation.confidence_score,
                'is_found': validation.is_found,
                'validation_method': validation.validation_method
            }
        
        return results
    
    def _get_validation_summary(self, analysis_metadata):
        """Get validation summary for a table"""
        validations = analysis_metadata.header_validations.all()
        found_count = validations.filter(is_found=True).count()
        total_count = validations.count()
        
        return {
            'all_headers_found': found_count == 4,
            'found_count': found_count,
            'missing_count': total_count - found_count,
            'found_headers': [
                {
                    'type': v.header_type,
                    'column': v.matched_column,
                    'confidence': v.confidence_score
                }
                for v in validations.filter(is_found=True)
            ],
            'missing_headers': [
                v.header_type for v in validations.filter(is_found=False)
            ],
            'can_generate_insights': found_count == 4
        }

class GenerateInsightsView(APIView):
    """Generate insights for a validated table"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, table_id):
        from .models import ImportedDataAnalysisMetadata
        
        try:
            analysis_metadata = ImportedDataAnalysisMetadata.objects.get(
                id=table_id,
                user=request.user
            )
            
            # Check if table is validated and all headers found
            if not analysis_metadata.is_validated:
                return Response({
                    "error": "Table headers must be validated before generating insights"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            found_headers = analysis_metadata.header_validations.filter(is_found=True).count()
            if found_headers < 4:
                return Response({
                    "error": "All required headers must be found before generating insights"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # TODO: Implement actual insights generation
            # For now, return a placeholder response
            return Response({
                "message": "Insights generation is not yet implemented",
                "table_id": table_id,
                "redirect_url": f"/feature/analyse-data/{table_id}/insights/"
            }, status=status.HTTP_200_OK)
            
        except ImportedDataAnalysisMetadata.DoesNotExist:
            return Response(
                {"error": "Table analysis metadata not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class CreateImportedDataAnalysisMetadataView(APIView):
    """Create table analysis metadata from a user data table"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from .models import ImportedDataMetadata, ImportedDataAnalysisMetadata
        from .serializers import ImportedDataAnalysisMetadataSerializer
        
        try:
            data_table_id = request.data.get('data_table_id')
            
            if not data_table_id:
                return Response(
                    {"error": "data_table_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the user data table
            user_data_table = ImportedDataMetadata.objects.get(
                id=data_table_id,
                user=request.user,
                import_status='completed'
            )
            
            # Check if analysis metadata already exists
            if ImportedDataAnalysisMetadata.objects.filter(user_data_table=user_data_table).exists():
                return Response(
                    {"error": "Table analysis metadata already exists for this data table"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create analysis metadata
            analysis_metadata = ImportedDataAnalysisMetadata.objects.create(
                user=request.user,
                user_data_table=user_data_table,
                display_name=user_data_table.display_name,
                file_path=user_data_table.processed_upload.processed_file_path,
                file_size=user_data_table.processed_upload.file_size,
                row_count=user_data_table.total_rows,
                headers=list(user_data_table.selected_columns)
            )
            
            serializer = ImportedDataAnalysisMetadataSerializer(analysis_metadata)
            
            return Response({
                "message": "Table analysis metadata created successfully",
                "table_analysis_metadata": serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except ImportedDataMetadata.DoesNotExist:
            return Response(
                {"error": "User data table not found or not completed"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to create table analysis metadata: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ImportedDataAnalysisMetadataPreviewView(APIView):
    """Get preview data for table analysis metadata"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, table_id):
        from .models import ImportedDataAnalysisMetadata
        from django.db import connection
        
        try:
            analysis_metadata = ImportedDataAnalysisMetadata.objects.get(
                id=table_id,
                user=request.user
            )
            
            # Get the actual table name from the linked ImportedDataMetadata
            table_name = analysis_metadata.user_data_table.table_name
            
            # Get limit from query params (default 5 for preview)
            limit = min(int(request.GET.get('limit', 5)), 100)  # Max 100 rows
            
            # Query the dynamic table for preview data
            with connection.cursor() as cursor:
                # Get column names from the table
                cursor.execute('''
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = %s
                    AND column_name NOT IN ('id', 'created_at', 'updated_at')
                    ORDER BY ordinal_position
                ''', [table_name])
                
                columns = [row[0] for row in cursor.fetchall()]
                
                if not columns:
                    return Response({
                        'preview_data': [],
                        'columns': [],
                        'total_rows': 0
                    }, status=status.HTTP_200_OK)
                
                # Get preview data
                columns_sql = ', '.join(f'"{col}"' for col in columns)
                cursor.execute(f'''
                    SELECT {columns_sql}
                    FROM "{table_name}"
                    ORDER BY id
                    LIMIT %s
                ''', [limit])
                
                rows = cursor.fetchall()
                
                # Convert to list of dictionaries
                preview_data = []
                for row in rows:
                    row_dict = {}
                    for i, col in enumerate(columns):
                        row_dict[col] = row[i]
                    preview_data.append(row_dict)
                
                # Get total row count
                cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                total_rows = cursor.fetchone()[0]
            
            return Response({
                'preview_data': preview_data,
                'columns': columns,
                'total_rows': total_rows
            }, status=status.HTTP_200_OK)
            
        except ImportedDataAnalysisMetadata.DoesNotExist:
            return Response(
                {"error": "Table analysis metadata not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch preview data: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
