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
from .models import DashboardFeature


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
                    "id": user.id,
                    "email": user.email
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
    
# API endpoint for user login (token issuance)
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
            "id": user.id,
            "email": user.email,
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

User = get_user_model()

class GoogleAuthView(APIView):
    def post(self, request):
        # Handle JSON data (modern approach) instead of form-data
        try:
            data = json.loads(request.body)
            token = data.get('token')
        except json.JSONDecodeError:
            return Response(
                {"success": False, "error": "Invalid JSON data"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not token:
            return Response(
                {"success": False, "error": "Token is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Validate the Google ID token
            id_info = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                '735267755465-memcani6u0bs11s1c5uq4hlefvc3fopf.apps.googleusercontent.com'  # Replace with env var
            )

            # Extract user data
            email = id_info['email']
            name = id_info.get('name', 'No Name')

            # Create or get user (use email as username if missing)
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'username': email.split('@')[0], 'first_name': name}  # Better username handling
            )

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            # Response data
            response_data = {
                "success": True,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": name,
                },
                "access": access_token,
                "refresh": str(refresh),
            }

            # Set HTTP-only cookies (secure in production)
            response = Response(
                response_data,
                status=status.HTTP_200_OK  # 200 is more appropriate for auth
            )
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=True,  # True in production (requires HTTPS)
                samesite='Lax',
                max_age=3600 * 24,  # 1 day expiry
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=True,  # True in production
                samesite='Lax',
                max_age=3600 * 24 * 7,  # 7 days expiry
            )

            return response

        except ValueError as e:
            return Response(
                {"success": False, "error": "Invalid Google token"},
                status=status.HTTP_401_UNAUTHORIZED
            )
