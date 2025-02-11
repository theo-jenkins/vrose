from django.contrib import admin
from .models import CustomUser, DashboardFeature

# Register your models here.
@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_active', 'date_joined')
    search_fields = ('email', 'id')
    list_filter = ('is_active',)

@admin.register(DashboardFeature)
class DashboardFeaturesAdmin(admin.ModelAdmin):
    list_display = ('id', 'key', 'title')
    search_fields = ('key', 'title', 'permission_code')
    list_filter = ('permission_code',)
