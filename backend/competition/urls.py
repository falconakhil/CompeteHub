from django.urls import path,include
from .views import ActiveContestsView, CompletedContestsView, ContestCreateView, ContestDeleteView, ContestRegistrationView, FutureContestsView

urlpatterns = [
    path('create/', ContestCreateView.as_view(), name='create-competition'),
    path('delete/<int:pk>/', ContestDeleteView.as_view(), name='delete-competition'),

    path('list/future/', FutureContestsView.as_view(), name='future-contests'),
    path('list/completed/', CompletedContestsView.as_view(), name='past-contests'),
    path('list/active/', ActiveContestsView.as_view(), name='ongoing-contests'),

    path('register/<int:pk>/', ContestRegistrationView.as_view(), name='register-contest'),
]