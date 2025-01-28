from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from .serializers import SignUpSerializer


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
            user =serializer.save()

            # Generate a new refresh token for the user
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            # Set tokens in cookies
            response = Response({"success": True, "message": "Login successful"})

            response.set_cookie(
                key='access_token',
                value=access_token,
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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # debugging
            print("Authorization Header:", request.headers.get('Authorization'))
            print("Cookies:", request.COOKIES)
            print("User:", request.user)

            # Extract the refresh token from the cookies
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({"success": False, "message": "Refresh token is required"}, status=400)

            # Invalidate the refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()

            # Clear the cookies on the client side
            response = Response({"success": True, "message": "User logged out successfully"}, status=200)
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')

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
            "email": user.email,
            "permissions": list(permissions)
        }
        return Response(response)