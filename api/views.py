from django.shortcuts import render
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from .models import CustomUser
from .serializers import CustomUserSerializer, RegisterSerializer
    
# Register user endpoint using class based views
class RegisterView(APIView):
    def post(self, request):
        # Passes the form data to the serializer
        serializer = RegisterSerializer(data=request.data)
        # Attempts to validate the serializer then saves the user
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "User registered successfully"})
        return Response({"success": False, "errors": serializer.errors}, status=400)
    
# Authentication endpoint using class based views
class LoginView(APIView):
    def post(self, request):
        # Fetches the form data
        email = request.data.get('email')
        password = request.data.get('password')
        # Attempts to authenticate the user
        user = authenticate(email=email, password=password)
        if user:
            # Creates a new auth token for the user
            token, created = Token.objects.get_or_create(user=user)
            return Response({"success": True, "token": token.key, "message": "User authenticated successfully"})
        return Response({"success": False, "message": "Invalid credentials"}, status=401)
    
# Log out endpoint using class based views
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({"success": True, "message": "User logged out successfully"})