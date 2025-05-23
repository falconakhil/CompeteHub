from django.urls import path
from .views import ProblemCreateView, ProblemListView, SubmissionCreateView, SubmissionListView, ProblemDetailView

urlpatterns=[
    path('create/', ProblemCreateView.as_view(), name='problem-create'),
    path('list/', ProblemListView.as_view(), name='problem-list'),
    path('<int:pk>/', ProblemDetailView.as_view(), name='problem-detail'),
    path('submission/create/<int:problem_id>/', SubmissionCreateView.as_view(), name='submission-create'),
    path('submission/list/<int:problem_id>/', SubmissionListView.as_view(), name='submission-list'),
]