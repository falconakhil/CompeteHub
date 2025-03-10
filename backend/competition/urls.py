from django.urls import path,include
from .views import ActiveContestsView, CompletedContestsView, ContestCreateView, ContestDeleteView, FutureContestsView
    
urlpatterns = [
    path('create/', ContestCreateView.as_view(), name='create-competition'),
    path('delete/<int:pk>/', ContestDeleteView.as_view(), name='delete-competition'),
    # path('info/',ContestDetailsView.as_view(),name='contest-details'),
    path('list/future/', FutureContestsView.as_view(), name='future-contests'),
    path('list/completed/', CompletedContestsView.as_view(), name='past-contests'),
    path('list/active/', ActiveContestsView.as_view(), name='ongoing-contests'),
]