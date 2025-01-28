from django.contrib import admin
from .models import CustomUser, KeyWords

# Register your models here.
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'key_word', 'is_active', 'date_joined')
    search_fields = ('email', 'key_word')
    list_filter = ('is_active',)

@admin.register(KeyWords)
class KeyWordsAdmin(admin.ModelAdmin):
    list_display = ('key_word', 'used')
    search_fields = ('key_word',)
    list_filter = ('used',)
