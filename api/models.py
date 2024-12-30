from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

# Custom user model including email, password and authenticated keyword
class CustomUser(AbstractUser):
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    key_word = models.CharField(max_length=100)
    username = None # Remove username field

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['key_word']

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='customuser_groups',  # Unique related name
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='customuser_user_permissions',  # Unique related name
        blank=True,
    )

    def __str__(self):
        return self.email
