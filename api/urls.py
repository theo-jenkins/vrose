from django.urls import path
from .views import (
    get_csrf_token, SignUpView, LogoutView, CustomTokenObtainPairView, 
    UserDetailsView, DashboardFeaturesView, GoogleAuthView,
    TemporaryFileUploadView, ConfirmUploadView, DiscardUploadView, UserUploadsView,
    ColumnSelectionView, ImportProgressView, ImportedDataMetadataView, 
    AnalyseDataView, ImportedDataAnalysisMetadataDetailView, ImportedDataAnalysisMetadataDeleteView, 
    HeaderValidationView, GenerateInsightsView, CreateImportedDataAnalysisMetadataView, ImportedDataAnalysisMetadataPreviewView
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
    
    # File upload endpoints
    path('features/upload-file/temp/', TemporaryFileUploadView.as_view(), name='temp_file_upload'),
    path('features/upload-file/confirm/<uuid:temp_id>/', ConfirmUploadView.as_view(), name='confirm_upload'),
    path('features/upload-file/discard/<uuid:temp_id>/', DiscardUploadView.as_view(), name='discard_upload'),
    path('features/upload-file/history/', UserUploadsView.as_view(), name='user_uploads'),
    
    # Column selection and data import endpoints
    path('features/upload-file/select-columns/<uuid:temp_id>/', ColumnSelectionView.as_view(), name='column_selection'),
    path('features/upload-file/import-progress/<uuid:task_id>/', ImportProgressView.as_view(), name='import_progress'),
    path('features/upload-file/data-tables/', ImportedDataMetadataView.as_view(), name='user_data_tables'),
    
    # Analyse data endpoints
    path('features/analyse-data/', AnalyseDataView.as_view(), name='analyse_data'),
    path('features/analyse-data/create/', CreateImportedDataAnalysisMetadataView.as_view(), name='create_table_analysis_metadata'),
    path('features/analyse-data/<uuid:table_id>/', ImportedDataAnalysisMetadataDetailView.as_view(), name='table_analysis_metadata_detail'),
    path('features/analyse-data/<uuid:table_id>/delete/', ImportedDataAnalysisMetadataDeleteView.as_view(), name='table_analysis_metadata_delete'),
    path('features/analyse-data/<uuid:table_id>/validate-headers/', HeaderValidationView.as_view(), name='header_validation'),
    path('features/analyse-data/<uuid:table_id>/generate-insights/', GenerateInsightsView.as_view(), name='generate_insights'),
    path('features/analyse-data/<uuid:table_id>/preview/', ImportedDataAnalysisMetadataPreviewView.as_view(), name='table_analysis_metadata_preview'),
]