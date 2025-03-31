from django.urls import path
from .views import ProblemCreateView,ProblemListView

urlpatterns=[
    path('create/', ProblemCreateView.as_view(), name='problem-create'),
    path('list/', ProblemListView.as_view(), name='problem-list'),
]