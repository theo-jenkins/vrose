from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import CustomUser

# Serializer converting a custom usre model object to JSON
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['user_id', 'email', 'key_word', 'is_active']

# Serializer for registering a new user
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['email', 'key_word', 'password'] # Include only the required fields
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists(): # Check if the email already exists
            raise serializers.ValidationError("Email already exists")
        return value
    
    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password']) # Hash the password
        return CustomUser.objects.create(**validated_data)