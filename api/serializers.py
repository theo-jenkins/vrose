from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import Permission
from .models import CustomUser

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