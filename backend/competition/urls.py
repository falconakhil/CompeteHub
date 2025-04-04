from django.urls import path,include
from .views import ActiveContestsView, CompletedContestsView, ContestCreateView, ContestDeleteView, ContestRegistrationView, FutureContestsView, ContestProblemsView, AddProblemsToContestView, RemoveProblemFromContestView

urlpatterns = [
    path('create/', ContestCreateView.as_view(), name='create-competition'),
    path('delete/<int:pk>/', ContestDeleteView.as_view(), name='delete-competition'),

    path('list/future/', FutureContestsView.as_view(), name='future-contests'),
    path('list/completed/', CompletedContestsView.as_view(), name='past-contests'),
    path('list/active/', ActiveContestsView.as_view(), name='ongoing-contests'),

    path('problems/list/<int:pk>/',ContestProblemsView.as_view(), name='contest-problems'),
    path('problems/add/<int:pk>/',AddProblemsToContestView.as_view(), name='add-problems'),
    path('problems/remove/<int:contest_id>/<int:problem_id>/',RemoveProblemFromContestView.as_view(), name='remove-problems'),

    path('register/<int:pk>/', ContestRegistrationView.as_view(), name='register-contest'),
]