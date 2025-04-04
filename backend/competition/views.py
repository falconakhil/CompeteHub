from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from .serializers import ContestSerializer
from problem.serializers import ProblemSerializer
from problem.models import Problem

from .models import Contest, ContestGenre, Participation,ContestProblem

from django.utils import timezone
from django.db import models
from django.db.models import F, ExpressionWrapper, DateTimeField
from datetime import timedelta

class ContestCreateView(APIView):
    """
    API endpoint for creating a new contest
    
    Method: POST
    
    Expected Input JSON:
    {
        "name": "Spring Coding Challenge 2025",
        "description": "A competitive programming contest featuring algorithmic problems across multiple difficulty levels.",
        "starting_time": "2025-04-15T09:00:00Z",
        "duration": 360,
        "genre_names": ["Algorithms", "Data Structures", "Mathematics"]
    }
    
    Returns:
    - 201 Created: Contest created successfully (returns contest details)
    - 400 Bad Request: Invalid input data
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        data = request.data.copy()
        
        # Handle genre names
        if 'genre_names' in data:
            genre_names = data.pop('genre_names')
            genres = []
            
            for name in genre_names:
                genre, created = ContestGenre.objects.get_or_create(name=name.lower().strip())
                genres.append(genre.id)
                
            data['genre_ids'] = genres
        
        serializer = ContestSerializer(data=data)
        if serializer.is_valid():
            # Set the creator to the current user
            serializer.save(creator=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ContestDeleteView(APIView):
    """
    API endpoint for deleting a contest
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        # Get the contest or return 404 if not found
        contest = get_object_or_404(Contest, pk=pk)
        
        # Check if the user is authorized to delete this contest
        if contest.creator != request.user:
            return Response(
                {"detail": "You do not have permission to delete this contest."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Delete the contest
        contest.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class ContestPagination(PageNumberPagination):
    """
    Custom pagination class for contests
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class FutureContestsView(ListAPIView):
    """
    API endpoint for retrieving future contests created by the authenticated user
    (contests that have not started yet),
    sorted by starting time in decreasing order.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ContestSerializer
    pagination_class = ContestPagination

    def get_queryset(self):
        now = timezone.now()
        # Get future contests created by the current user
        return Contest.objects.filter(
            creator=self.request.user,
            starting_time__gt=now  # Contest has not started yet
        ).order_by('-starting_time')  # Sort by starting time in decreasing order


class ActiveContestsView(ListAPIView):
    """
    API endpoint for retrieving active contests
    (contests that have started but not ended yet),
    sorted by ending time in decreasing order.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ContestSerializer
    pagination_class = ContestPagination

    def get_queryset(self):
        now = timezone.now()
        # Annotate contests with their ending time
        return Contest.objects.annotate(
            end_time=ExpressionWrapper(F('starting_time') + F('duration'), output_field=DateTimeField())
        ).filter(
            creator=self.request.user,
            starting_time__lte=now,  # Contest has started
            end_time__gte=now        # Contest has not ended
        ).order_by('-end_time')  # Sort by ending time in decreasing order


class CompletedContestsView(ListAPIView):
    """
    API endpoint for retrieving completed contests
    (contests that have ended), sorted by end time (most recent first).
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ContestSerializer
    pagination_class = ContestPagination

    def get_queryset(self):
        now = timezone.now()
        # Filter contests that have ended (end_time < now)
        return Contest.objects.annotate(
            end_time=ExpressionWrapper(F('starting_time') + F('duration'), output_field=DateTimeField())
        ).filter(
            creator=self.request.user,
            end_time__lt=now  # Contest has ended
        ).order_by('-end_time')  # Sort by end time, most recent first

class ContestRegistrationView(APIView):
    """
    API endpoint for registering a user for a contest
    
    Method: POST
    
    URL Parameter:
    - pk: Contest ID
    
    Returns:
    - 201 Created: Successfully registered for the contest
    - 400 Bad Request: Registration failed (already registered or invalid contest)
    - 403 Forbidden: Contest registration not allowed (e.g. contest already started)
    - 404 Not Found: Contest with provided ID doesn't exist
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        # Get the contest or return 404 if not found
        contest = get_object_or_404(Contest, pk=pk)
        
        # Check if the contest has already started
        now = timezone.now()
        if contest.starting_time <= now:
            return Response(
                {"detail": "Cannot register for a contest that has already started."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if user is already registered
        if Participation.objects.filter(user=request.user, contest=contest).exists():
            return Response(
                {"detail": "You are already registered for this contest."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the participation record
        try:
            Participation.objects.create(
                user=request.user,
                contest=contest
            )
            return Response(
                {"detail": f"Successfully registered for contest: {contest.name}"},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"detail": f"Registration failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class ContestProblemPagination(PageNumberPagination):
    """
    Custom pagination class for contest problems
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class ContestProblemsView(ListAPIView):
    """
    API endpoint for retrieving paginated problems of a specific contest
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ProblemSerializer
    pagination_class = ContestProblemPagination

    def get_queryset(self):
        # Get the contest ID from the URL
        contest_id = self.kwargs.get('pk')
        # Filter problems for the given contest
        return ContestProblem.objects.filter(contest_id=contest_id).order_by('order').values_list('problem', flat=True)

    def list(self, request, *args, **kwargs):
        # Get the queryset of problem IDs
        problem_ids = self.get_queryset()
        # Fetch the actual Problem objects
        queryset = Problem.objects.filter(id__in=problem_ids)
        # Paginate the queryset
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
class AddProblemsToContestView(APIView):
    """
    API endpoint for adding problems to a contest
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # Get the contest or return 404 if not found
        contest = get_object_or_404(Contest, pk=pk)

        # Check if the user is the creator of the contest
        if contest.creator != request.user:
            return Response(
                {"detail": "You do not have permission to add problems to this contest."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get the list of problem IDs from the request data
        problem_ids = request.data.get('problem_ids', [])
        if not isinstance(problem_ids, list) or not problem_ids:
            return Response(
                {"detail": "A list of problem IDs is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Add problems to the contest
        added_problems = []
        for problem_id in problem_ids:
            problem = Problem.objects.filter(id=problem_id).first()
            if not problem:
                return Response(
                    {"detail": f"Problem with ID {problem_id} does not exist."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Create or update the ContestProblem entry
            contest_problem, created = ContestProblem.objects.get_or_create(
                contest=contest,
                problem=problem,
                defaults={'points': 100, 'order': ContestProblem.objects.filter(contest=contest).count() + 1}
            )
            added_problems.append(problem.id)

        return Response(
            {"detail": f"Successfully added problems to contest: {contest.name}", "added_problems": added_problems},
            status=status.HTTP_200_OK
        )