from django.urls import path,include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import SignUp, UserProfile, DeleteUser

urlpatterns = [
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('signup/',SignUp.as_view(),name='signup'),
    path('profile/', UserProfile.as_view(), name='user-profile'),
    path('delete/', DeleteUser.as_view(), name='delete'),
]
