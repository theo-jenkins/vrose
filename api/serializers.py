from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import Permission
from .models import CustomUser, KeyWords

# Serializer converting a custom usre model object to JSON
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['user_id', 'email', 'key_word', 'is_active']

class SignUpSerializer(serializers.ModelSerializer):
    key_word = serializers.CharField(required=False, allow_blank=True) # Optional keyword
    confirm_password = serializers.CharField(write_only=True)  # Explicitly define confirm_password field

    class Meta:
        model = CustomUser
        fields = ['email', 'key_word', 'password', 'confirm_password']
        extra_kwargs = {
            'password': {'write_only': True},  # Ensure password is write-only
        }

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate_key_word(self, value):
        if value:
            try:
                keyword_obj = KeyWords.objects.get(key_word=value)
                if keyword_obj.used:
                    raise serializers.ValidationError("This keyword has already been used.")
                return value
            except KeyWords.DoesNotExist:
                raise serializers.ValidationError("Invalid keyword.")

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        key_word = validated_data.get('key_word', '')

        # Create the user
        user = CustomUser.objects.create_user(email=email, password=password)

        # Mark the keyword as used and save to user profile
        if key_word:
            keyword_obj = KeyWords.objects.get(key_word=key_word)
            keyword_obj.user = user
            keyword_obj.used = True
            keyword_obj.save()

            special_permissions = Permission.objects.get(codename='access_special_features')
            user.user_permissions.add(special_permissions)

        return user
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Call the parent class's validate method to authenticate the user
        data = super().validate(attrs)

        # Include user details in the response
        data['user'] = {
            'id': self.user.user_id,
            'email': self.user.email,
        }
        return data