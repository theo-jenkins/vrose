import json
import os
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from google.oauth2 import id_token
from google.auth.transport import requests
from .serializers import SignUpSerializer, CustomTokenObtainPairSerializer
from .models import CustomUser, DashboardFeature


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
        from .models import TemporaryUpload, ProcessedUpload, UserDataTable
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
            
            # Create UserDataTable record
            data_table = UserDataTable.objects.create(
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
            while UserDataTable.objects.filter(table_name=table_name).exists():
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
        from .models import UserDataTable
        from .serializers import ImportProgressSerializer
        
        try:
            data_table = UserDataTable.objects.get(
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
            
        except UserDataTable.DoesNotExist:
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

class UserDataTablesView(APIView):
    """Get user's imported data tables"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .models import UserDataTable
        from .serializers import UserDataTableSerializer
        
        # Get user's data tables
        data_tables = UserDataTable.objects.filter(
            user=request.user
        ).order_by('-created_at')
        
        serializer = UserDataTableSerializer(data_tables, many=True)
        
        return Response({
            "data_tables": serializer.data
        }, status=status.HTTP_200_OK)
