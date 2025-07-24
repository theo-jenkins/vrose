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
from .models import CustomUser, DashboardFeature, DatasetAnalysisMetadata


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
    """Column selection + dataset creation + start import (consolidated workflow)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, temp_id):
        from .models import TemporaryUpload, UserDataset
        from .serializers import UserDatasetSerializer
        from .utils.dynamic_tables import analyze_file_for_import, DynamicTableManager
        from django.utils import timezone
        from django.conf import settings
        import os
        
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
            
            # Extract and validate request data
            dataset_name = request.data.get('name', temp_upload.original_filename)
            selected_columns = request.data.get('selected_columns', [])
            
            if not selected_columns:
                return Response(
                    {"error": "Selected columns are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
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
            
            # Create UserDataset record
            dataset = UserDataset.objects.create(
                user=request.user,
                temporary_upload=temp_upload,
                name=dataset_name,
                original_filename=temp_upload.original_filename,
                table_name='',  # Will be generated
                selected_columns=selected_columns,
                column_mapping=analysis['column_mapping'],
                column_types=analysis['column_types'],
                total_rows=analysis['total_rows'],
                file_size=temp_upload.file_size,
                file_type=temp_upload.file_type,
                status='importing'
            )
            
            # Generate and set unique table name
            dataset.table_name = dataset.generate_table_name()
            
            # Ensure table name is unique
            counter = 1
            original_table_name = dataset.table_name
            while UserDataset.objects.filter(table_name=dataset.table_name).exclude(id=dataset.id).exists():
                dataset.table_name = f"{original_table_name}_{counter}"
                counter += 1
            
            dataset.save()
            
            # Create the database table
            table_created = DynamicTableManager.create_table(
                dataset.table_name,
                analysis['column_types']
            )
            
            if not table_created:
                dataset.status = 'failed'
                dataset.error_details = {'error': 'Failed to create database table'}
                dataset.save()
                
                return Response(
                    {"error": "Failed to create database table"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Queue Celery task for data import
            from .tasks import import_data_task
            task_result = import_data_task.delay(str(dataset.id))
            dataset.celery_task_id = str(task_result.id)
            dataset.save()
            
            serializer = UserDatasetSerializer(dataset)
            
            return Response({
                "success": True,
                "dataset": serializer.data,
                "task_id": task_result.id,
                "message": "Dataset created and import started"
            }, status=status.HTTP_201_CREATED)
            
        except TemporaryUpload.DoesNotExist:
            return Response(
                {"error": "Upload not found or already processed"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Dataset creation failed: {str(e)}"},
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

class UserDatasetsView(APIView):
    """List all user's datasets (replaces UserUploadsView)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .models import UserDataset
        from .serializers import UserDatasetSerializer
        
        # Get user's datasets with optional status filtering
        status_filter = request.GET.get('status')
        datasets = UserDataset.objects.filter(user=request.user)
        
        if status_filter:
            datasets = datasets.filter(status=status_filter)
        
        datasets = datasets.order_by('-created_at')
        serializer = UserDatasetSerializer(datasets, many=True)
        
        return Response({
            "success": True,
            "datasets": serializer.data,
            "total_count": datasets.count()
        }, status=status.HTTP_200_OK)

class ImportProgressView(APIView):
    """Track import progress by Celery task ID (updated for UserDataset)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, task_id):
        from .models import UserDataset, ImportTask
        from celery.result import AsyncResult
        
        try:
            # Try to find by dataset ID first, then by task ID
            dataset = None
            try:
                dataset = UserDataset.objects.get(
                    id=task_id,
                    user=request.user
                )
                celery_task_id = dataset.celery_task_id
            except UserDataset.DoesNotExist:
                # Try to find by celery task ID
                dataset = UserDataset.objects.get(
                    celery_task_id=task_id,
                    user=request.user
                )
                celery_task_id = task_id
            
            # Get Celery task status if available
            task_result = AsyncResult(str(celery_task_id)) if celery_task_id else None
            celery_status = task_result.status if task_result else None
            
            # Get ImportTask for detailed progress if available
            import_task = None
            try:
                import_task = ImportTask.objects.filter(
                    dataset=dataset,
                    status__in=['running', 'completed', 'failed']
                ).first()
            except ImportTask.DoesNotExist:
                pass
            
            # Determine current progress
            if import_task:
                current = import_task.current_step
                total = import_task.total_steps
                percentage = import_task.progress_percentage
                message = import_task.progress_message or self._get_progress_message(dataset)
            else:
                current = dataset.total_rows if dataset.status == 'active' else 0
                total = dataset.total_rows or 0
                percentage = 100 if dataset.status == 'active' else 0
                message = self._get_progress_message(dataset)
            
            return Response({
                "success": True,
                "task_id": str(task_id),
                "dataset_id": str(dataset.id),
                "status": dataset.status,
                "celery_status": celery_status,
                "current": current,
                "total": total,
                "percentage": percentage,
                "message": message,
                "table_name": dataset.table_name,
                "dataset_name": dataset.name,
                "error_details": dataset.error_details
            }, status=status.HTTP_200_OK)
            
        except UserDataset.DoesNotExist:
            return Response(
                {"error": "Import task not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to get progress: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_progress_message(self, dataset):
        """Generate human-readable progress message"""
        if dataset.status == 'importing':
            return "Import in progress..."
        elif dataset.status == 'active':
            return f"Import completed! Dataset '{dataset.name}' is ready."
        elif dataset.status == 'failed':
            error = dataset.error_details.get('error', 'Unknown error') if dataset.error_details else 'Unknown error'
            return f"Import failed: {error}"
        elif dataset.status == 'archived':
            return "Dataset has been archived"
        else:
            return f"Status: {dataset.status}"


# Analyse Data Feature Views  
class AnalyseDataView(APIView):
    """List user's datasets available for analysis"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .models import DatasetAnalysisMetadata, UserDataset
        from .serializers import DatasetAnalysisMetadataListSerializer
        
        logger.info(f"User {request.user.email} requesting analyse data tables")
        
        # Get user's active datasets
        active_datasets = UserDataset.objects.filter(
            user=request.user,
            status='active'
        )
        
        logger.info(f"Found {active_datasets.count()} active datasets for user {request.user.email}")
        
        # Create DatasetAnalysisMetadata records for any that don't exist
        created_count = 0
        for dataset in active_datasets:
            analysis_metadata, created = DatasetAnalysisMetadata.objects.get_or_create(
                dataset=dataset,
                defaults={}
            )
            if created:
                created_count += 1
                logger.info(f"Created DatasetAnalysisMetadata for UserDataset {dataset.id}")
        
        logger.info(f"Created {created_count} new DatasetAnalysisMetadata records")
        
        # Get user's analysis metadata
        analysis_metadata = DatasetAnalysisMetadata.objects.filter(
            dataset__user=request.user
        ).select_related('dataset').prefetch_related('header_validations')
        
        logger.info(f"Returning {analysis_metadata.count()} analysis metadata records")
        
        serializer = DatasetAnalysisMetadataListSerializer(analysis_metadata, many=True)
        
        return Response({
            "saved_tables": serializer.data,
            "total_count": analysis_metadata.count()
        }, status=status.HTTP_200_OK)

class DatasetAnalysisDetailView(APIView):
    """Get detailed information about dataset analysis metadata"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, dataset_id):
        from .models import DatasetAnalysisMetadata
        from .serializers import DatasetAnalysisMetadataSerializer
        
        try:
            analysis_metadata = DatasetAnalysisMetadata.objects.get(
                id=dataset_id,
                dataset__user=request.user
            )
            
            serializer = DatasetAnalysisMetadataSerializer(analysis_metadata)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except DatasetAnalysisMetadata.DoesNotExist:
            return Response(
                {"error": "Dataset analysis metadata not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class DatasetDeleteView(APIView):
    """Delete dataset and associated analysis metadata"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, dataset_id):
        from .models import UserDataset
        from .utils.dynamic_tables import DynamicTableManager
        from django.db import transaction
        import logging
        
        logger = logging.getLogger(__name__)

        try:
            dataset = UserDataset.objects.get(
                id=dataset_id,
                user=request.user
            )
            
            dataset_name = dataset.name
            table_name = dataset.table_name
            
            # Delete both the dataset records and the dynamic table
            with transaction.atomic():
                # First delete the dynamic table
                if table_name:
                    try:
                        DynamicTableManager.drop_table(table_name)
                        logger.info(f'Dropped dynamic table: {table_name}')
                    except Exception as e:
                        logger.warning(f'Failed to drop dynamic table: {table_name}: {str(e)}')
                        # Continue with deletion even if table drop fails
                # Delete dataset record (DatasetAnalysisMetadata will cascade delete)
                dataset.delete()
            
            return Response({
                "message": f"Dataset '{dataset_name}' and all associated data deleted successfully"
            }, status=status.HTTP_200_OK)
            
        except UserDataset.DoesNotExist:
            return Response(
                {"error": "Dataset not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class HeaderValidationView(APIView):
    """Validate headers for a dataset"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, dataset_id):
        from .models import DatasetAnalysisMetadata, HeaderValidation
        from .serializers import HeaderValidationRequestSerializer, HeaderValidationResponseSerializer
        from .services.header_validator import HeaderValidator
        from django.utils import timezone
        import pandas as pd
        
        try:
            analysis_metadata = DatasetAnalysisMetadata.objects.get(
                id=dataset_id,
                dataset__user=request.user
            )
            
            serializer = HeaderValidationRequestSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            force_revalidate = serializer.validated_data.get('force_revalidate', False)
            
            # Check if already validated and not forcing revalidation
            if analysis_metadata.is_analysis_ready and not force_revalidate:
                return Response({
                    "success": True,
                    "message": "Headers already validated",
                    "validation_results": self._get_existing_validation_results(analysis_metadata),
                    "validation_summary": self._get_validation_summary(analysis_metadata)
                }, status=status.HTTP_200_OK)
            
            # Perform header validation
            validator = HeaderValidator()
            headers = list(analysis_metadata.dataset.selected_columns)
            
            validation_results = validator.validate_headers(headers)
            validation_summary = validator.get_validation_summary(validation_results)
            
            # Clear existing validations if revalidating
            if force_revalidate:
                analysis_metadata.header_validations.all().delete()
            
            # Save validation results
            for header_type, result in validation_results.items():
                HeaderValidation.objects.update_or_create(
                    dataset_analysis=analysis_metadata,
                    header_type=header_type,
                    defaults={
                        'matched_column': result['matched_column'],
                        'confidence_score': result['confidence_score'],
                        'is_found': result['is_found'],
                        'validation_method': result['validation_method']
                    }
                )
            
            # Update analysis metadata validation status
            analysis_metadata.is_analysis_ready = True
            analysis_metadata.analysis_validated_at = timezone.now()
            analysis_metadata.save()
            
            return Response({
                "success": True,
                "message": "Header validation completed",
                "validation_results": validation_results,
                "validation_summary": validation_summary
            }, status=status.HTTP_200_OK)
            
        except DatasetAnalysisMetadata.DoesNotExist:
            return Response(
                {"error": "Dataset analysis metadata not found"},
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
    """Generate insights for a validated dataset"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, dataset_id):
        from .models import DatasetAnalysisMetadata
        
        try:
            analysis_metadata = DatasetAnalysisMetadata.objects.get(
                id=dataset_id,
                dataset__user=request.user
            )
            
            # Check if dataset is validated and all headers found
            if not analysis_metadata.is_analysis_ready:
                return Response({
                    "error": "Dataset headers must be validated before generating insights"
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
                "dataset_id": dataset_id,
                "redirect_url": f"/feature/analyse-data/{dataset_id}/insights/"
            }, status=status.HTTP_200_OK)
            
        except DatasetAnalysisMetadata.DoesNotExist:
            return Response(
                {"error": "Dataset analysis metadata not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class DatasetPreviewView(APIView):
    """Get preview data for a dataset"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, dataset_id):
        from .models import UserDataset
        from django.db import connection
        
        try:
            dataset = UserDataset.objects.get(
                id=dataset_id,
                user=request.user,
                status='active'
            )
            
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
                ''', [dataset.table_name])
                
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
                    FROM "{dataset.table_name}"
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
                cursor.execute(f'SELECT COUNT(*) FROM "{dataset.table_name}"')
                total_rows = cursor.fetchone()[0]
            
            return Response({
                'preview_data': preview_data,
                'columns': columns,
                'total_rows': total_rows,
                'dataset_name': dataset.name
            }, status=status.HTTP_200_OK)
            
        except UserDataset.DoesNotExist:
            return Response(
                {"error": "Dataset not found or not active"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch preview data: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
