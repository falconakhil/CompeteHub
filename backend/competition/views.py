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

class FutureContestsView(APIView):
    """
    API endpoint for retrieving future contests created by the authenticated user
    (contests that have not started yet)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        now = timezone.now()
        # Get future contests created by the current user
        future_contests = Contest.objects.filter(
            creator=request.user,
            starting_time__gt=now
        )
        
        # Serialize the contest data
        serializer = ContestSerializer(future_contests, many=True)
        
        # Return the serialized data
        return Response(serializer.data, status=status.HTTP_200_OK)


class ActiveContestsView(APIView):
    """
    API endpoint for retrieving active contests
    (contests that have started but not ended yet)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        now = timezone.now()
        # Get active contests created by the current user
        active_contests = []
        
        # Need to check each contest's end time based on duration
        for contest in Contest.objects.filter(starting_time__lte=now):
            end_time = contest.starting_time + contest.duration
            if end_time >= now:
                active_contests.append(contest)
        
        # Serialize the contest data
        serializer = ContestSerializer(active_contests, many=True)
        
        # Return the serialized data
        return Response(serializer.data, status=status.HTTP_200_OK)


class CompletedContestsView(APIView):
    """
    API endpoint for retrieving completed contests
    (contests that have ended) within a specified date range.
    
    Method: GET
    
    Expected Input JSON (optional):
    {
        "start_date": "2025-01-01",  // optional, defaults to 30 days ago
        "end_date": "2025-03-31"     // optional, defaults to today
    }
    
    Returns:
    - 200 OK: List of completed contests within date range
    - 400 Bad Request: Invalid date format
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        now = timezone.now()
        
        # Get date range from JSON body with defaults
        try:
            # Default to last 30 days if not specified
            default_start = (now - timedelta(days=30)).date().isoformat()
            default_end = now.date().isoformat()
            
            data = request.data
            start_date_str = data.get('start_date', default_start)
            end_date_str = data.get('end_date', default_end)
            
            # Parse the date strings to datetime objects
            start_date = timezone.datetime.strptime(start_date_str, '%Y-%m-%d')
            # Set end_date to end of day
            end_date = timezone.datetime.strptime(end_date_str, '%Y-%m-%d')
            end_date = end_date.replace(hour=23, minute=59, second=59)
            
            # Convert to timezone-aware datetime if needed
            if timezone.is_naive(start_date):
                start_date = timezone.make_aware(start_date)
            if timezone.is_naive(end_date):
                end_date = timezone.make_aware(end_date)
                
        except ValueError:
            return Response(
                {"error": "Invalid date format. Please use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get completed contests created by the current user within date range
        completed_contests = []
        
        # Filter contests that started before now (potentially completed)
        potential_contests = Contest.objects.filter(
            # creator=request.user,
            starting_time__lte=now
        )
        
        # Check each contest's end time and filter by date range
        for contest in potential_contests:
            end_time = contest.starting_time + contest.duration
            if end_time < now and start_date <= end_time <= end_date:
                completed_contests.append(contest)
        
        # Serialize the contest data
        serializer = ContestSerializer(completed_contests, many=True)
        
        # Return the serialized data
        return Response(serializer.data, status=status.HTTP_200_OK)
    
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