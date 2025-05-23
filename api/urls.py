from django.urls import path
from .views import get_csrf_token, SignUpView, LogoutView, CustomTokenObtainPairView, UserDetailsView, DashboardFeaturesView, GoogleAuthView
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

urlpatterns = [
    path('csrf-token/', get_csrf_token, name='csrf_token'),
    path('signup/', SignUpView.as_view(), name='signup'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('user-details/', UserDetailsView.as_view(), name='user_details'),
    path('dashboard-features/', DashboardFeaturesView.as_view(), name='dashboard_features'),
    path('google-auth/', GoogleAuthView.as_view(), name='google_auth'),
]