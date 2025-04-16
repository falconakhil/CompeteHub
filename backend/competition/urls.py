from django.urls import path,include
from .views import (
    ActiveContestsView, 
    CompletedContestsView, 
    ContestCreateView, 
    ContestDeleteView, 
    ContestRegistrationView,
    ContestUnregisterView,
    FutureContestsView, 
    ContestProblemsView, 
    AddProblemsToContestView, 
    RemoveProblemFromContestView, 
    ContestDetailView,
    ContestProblemByOrderView,
    ContestProblemSubmitView,
    UserRankView,
    TopUsersView
)

urlpatterns = [
    path('create/', ContestCreateView.as_view(), name='create-competition'),
    path('delete/<int:pk>/', ContestDeleteView.as_view(), name='delete-competition'),
    path('<int:pk>/', ContestDetailView.as_view(), name='contest-detail'),

    path('list/future/', FutureContestsView.as_view(), name='future-contests'),
    path('list/completed/', CompletedContestsView.as_view(), name='past-contests'),
    path('list/active/', ActiveContestsView.as_view(), name='ongoing-contests'),

    path('problems/list/<int:pk>/',ContestProblemsView.as_view(), name='contest-problems'),
    path('problems/add/<int:pk>/',AddProblemsToContestView.as_view(), name='add-problems'),
    path('problems/remove/<int:contest_id>/<int:problem_id>/',RemoveProblemFromContestView.as_view(), name='remove-problems'),
    path('<int:contest_id>/problems/<int:order>/', ContestProblemByOrderView.as_view(), name='contest-problem-by-order'),
    path('<int:contest_id>/problems/<int:order>/submit/', ContestProblemSubmitView.as_view(), name='contest-problem-submit'),

    path('register/<int:pk>/', ContestRegistrationView.as_view(), name='register-contest'),
    path('unregister/<int:pk>/', ContestUnregisterView.as_view(), name='unregister-contest'),

    path('leaderboard/<int:contest_id>/user/<str:username>/', UserRankView.as_view(), name='user-rank'),
    path('leaderboard/<int:contest_id>/top/', TopUsersView.as_view(), name='top-users'),
]