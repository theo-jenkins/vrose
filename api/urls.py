from django.urls import path
from .views import (
    get_csrf_token, SignUpView, LogoutView, CustomTokenObtainPairView, 
    UserDetailsView, DashboardFeaturesView, GoogleAuthView,
    TemporaryFileUploadView, ConfirmUploadView, DiscardUploadView, UserDatasetsView,
    ImportProgressView, AnalyseDataView, DatasetAnalysisDetailView, DatasetDeleteView, 
    HeaderValidationView, GenerateInsightsView, DatasetPreviewView
)
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

urlpatterns = [
    path('csrf-token/', get_csrf_token, name='csrf_token'),
    path('signup/', SignUpView.as_view(), name='signup'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('signin/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('user-details/', UserDetailsView.as_view(), name='user_details'),
    path('dashboard-features/', DashboardFeaturesView.as_view(), name='dashboard_features'),
    path('google-auth/', GoogleAuthView.as_view(), name='google_auth'),
    
    # File upload endpoints (5 clean, purpose-driven endpoints)
    path('features/upload-file/temp/', TemporaryFileUploadView.as_view(), name='temp_file_upload'),
    path('features/upload-file/confirm/<uuid:temp_id>/', ConfirmUploadView.as_view(), name='confirm_upload'),
    path('features/upload-file/discard/<uuid:temp_id>/', DiscardUploadView.as_view(), name='discard_upload'),
    path('features/upload-file/datasets/', UserDatasetsView.as_view(), name='user_datasets'),
    path('features/upload-file/import-progress/<uuid:task_id>/', ImportProgressView.as_view(), name='import_progress'),
    
    # Dataset analysis endpoints
    path('features/analyse-data/', AnalyseDataView.as_view(), name='analyse_data'),
    path('features/analyse-data/<uuid:dataset_id>/', DatasetAnalysisDetailView.as_view(), name='dataset_analysis_detail'),
    path('features/analyse-data/<uuid:dataset_id>/delete/', DatasetDeleteView.as_view(), name='dataset_delete'),
    path('features/analyse-data/<uuid:dataset_id>/validate-headers/', HeaderValidationView.as_view(), name='header_validation'),
    path('features/analyse-data/<uuid:dataset_id>/generate-insights/', GenerateInsightsView.as_view(), name='generate_insights'),
    path('features/analyse-data/<uuid:dataset_id>/preview/', DatasetPreviewView.as_view(), name='dataset_preview'),
]