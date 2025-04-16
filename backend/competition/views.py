from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from .serializers import ContestSerializer
from problem.serializers import ProblemSerializer, SubmissionSerializer
from problem.models import Problem, Submission

from .models import Contest, ContestGenre, Participation, ContestProblem

from django.utils import timezone
from django.db.models import F, ExpressionWrapper, DateTimeField

import logging
logger = logging.getLogger(__name__)

class ContestCreateView(APIView):
    """
    API endpoint for creating a new contest
    
    Method: POST
    
    Expected Input JSON:
    {
        "name": "Spring Coding Challenge 2025",
        "description": "A competitive programming contest...",
        "starting_time": "2025-04-15T09:00:00Z",
        "duration": 60,  # Duration in minutes
        "genre_names": ["Algorithms", "Data Structures"]
    }
    
    Returns:
    - 201 Created: Contest created successfully (returns contest details)
    - 400 Bad Request: Invalid input data
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            data = request.data.copy()
            
            # Validate that the starting_time is in the future
            starting_time = data.get('starting_time')
            if starting_time:
                try:
                    starting_time = timezone.datetime.fromisoformat(starting_time.replace('Z', '+00:00'))
                    if starting_time <= timezone.now():
                        return Response(
                            {"detail": "The starting time must be in the future."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except ValueError:
                    return Response(
                        {"detail": "Invalid starting_time format. Use ISO 8601 format."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Handle genre names
            if 'genre_names' in data:
                genre_names = data.pop('genre_names')
                if not isinstance(genre_names, list):
                    return Response(
                        {"detail": "genre_names must be a list"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                genres = []
                for name in genre_names:
                    genre, created = ContestGenre.objects.get_or_create(
                        name=name.lower().strip()
                    )
                    genres.append(genre.id)
                
                data['genre_ids'] = genres
            
            # Validate duration is a positive integer
            if 'duration' in data:
                try:
                    duration_minutes = int(data['duration'])
                    if duration_minutes <= 0:
                        return Response(
                            {"detail": "Duration must be positive"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except (ValueError, TypeError):
                    return Response(
                        {"detail": "Duration must be a valid number of minutes"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            serializer = ContestSerializer(data=data)
            if serializer.is_valid():
                # Set the creator to the current user
                contest = serializer.save(creator=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
class ContestDeleteView(APIView):
    """
    API endpoint for deleting a contest.
    Only future contests (not yet started) can be deleted, and only by their creator.
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
        
        # Check if the contest has already started
        now = timezone.now()
        if contest.starting_time <= now:
            return Response(
                {"detail": "You can only delete contests that have not yet started."},
                status=status.HTTP_400_BAD_REQUEST
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
    API endpoint for retrieving all future contests
    (contests that have not started yet),
    sorted by starting time in decreasing order.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ContestSerializer
    pagination_class = ContestPagination

    def get_queryset(self):
        now = timezone.now()
        # Get all future contests
        return Contest.objects.filter(
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
        # Annotate contests with their ending time (duration is in minutes)
        return Contest.objects.annotate(
            end_time=ExpressionWrapper(
                F('starting_time') + timezone.timedelta(minutes=F('duration')), 
                output_field=DateTimeField()
            )
        ).filter(
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
        logger.info(f'Current time: {now}')
        
        # Filter contests that have ended (end_time < now)
        queryset = Contest.objects.annotate(
            end_time=ExpressionWrapper(
                F('starting_time') + timezone.timedelta(minutes=F('duration')), 
                output_field=DateTimeField()
            )
        ).filter(
            end_time__lt=now  # Contest has ended
        ).order_by('-end_time')  # Sort by end time, most recent first
        
        logger.info(f'Found {queryset.count()} completed contests')
        return queryset

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
    API endpoint for retrieving paginated problems of a specific contest.
    Problems can be viewed after the contest has started or completed.
    Only registered users can view problems.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ProblemSerializer
    pagination_class = ContestProblemPagination

    def get_queryset(self):
        # Get the contest ID from the URL
        contest_id = self.kwargs.get('pk')
        contest = get_object_or_404(Contest, pk=contest_id)
        
        # Check if the user is registered for this contest
        is_registered = Participation.objects.filter(user=self.request.user, contest=contest).exists()
        if not is_registered:
            return Problem.objects.none()  # Return empty queryset if user is not registered
        
        # Check if the contest has started
        now = timezone.now()
        if contest.starting_time > now:
            return Problem.objects.none()  # Return empty queryset if contest hasn't started
        
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
    API endpoint for adding problems to a contest.
    Problems can only be added if the contest has not yet started.
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

        # Check if the contest has already started
        now = timezone.now()
        if contest.starting_time <= now:
            return Response(
                {"detail": "You cannot add problems to a contest that has already started."},
                status=status.HTTP_400_BAD_REQUEST
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
    
class RemoveProblemFromContestView(APIView):
    """
    API endpoint for adding problems to a contest.

    Permissions:
    - Only authenticated users can access this endpoint.
    - Only the creator of the contest can add problems to it.

    Conditions:
    - Problems can only be added if the contest has not yet started.
    - The request must include a list of valid problem IDs.

    URL Parameters:
    - pk (int): The ID of the contest.

    Request Body:
    - problem_ids (list of int): A list of problem IDs to be added to the contest.

    Example Usage:
    - Add problems with IDs 1, 2, and 3 to a contest with ID 10:
        Endpoint: /api/contests/10/add_problems/
        Method: POST
        Request Body:
        {
            "problem_ids": [1, 2, 3]
        }
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, contest_id, problem_id):
        # Get the contest or return 404 if not found
        contest = get_object_or_404(Contest, pk=contest_id)

        # Check if the user is the creator of the contest
        if contest.creator != request.user:
            return Response(
                {"detail": "You do not have permission to modify this contest."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if the contest has already started
        now = timezone.now()
        if contest.starting_time <= now:
            return Response(
                {"detail": "You cannot remove problems from a contest that has already started."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the ContestProblem entry or return 404 if not found
        contest_problem = ContestProblem.objects.filter(contest=contest, problem_id=problem_id).first()
        if not contest_problem:
            return Response(
                {"detail": "The specified problem is not part of this contest."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Delete the ContestProblem entry
        contest_problem.delete()

        return Response(
            {"detail": f"Problem with ID {problem_id} has been removed from contest '{contest.name}'."},
            status=status.HTTP_200_OK
        )

class ContestDetailView(APIView):
    """
    API endpoint for retrieving details of a specific contest
    
    Method: GET
    
    URL Parameter:
    - pk: Contest ID
    
    Returns:
    - 200 OK: Contest details
    - 404 Not Found: Contest with provided ID doesn't exist
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        # Get the contest or return 404 if not found
        contest = get_object_or_404(Contest, pk=pk)
        
        # Check if the user is registered for this contest
        is_registered = Participation.objects.filter(user=request.user, contest=contest).exists()
        
        # Serialize the contest data
        serializer = ContestSerializer(contest)
        data = serializer.data
        
        # Add registration status to the response
        data['is_registered'] = is_registered
        
        return Response(data)

class ContestUnregisterView(APIView):
    """
    API endpoint for unregistering a user from a contest
    
    Method: POST
    
    URL Parameter:
    - pk: Contest ID
    
    Returns:
    - 200 OK: Successfully unregistered from the contest
    - 404 Not Found: Contest with provided ID doesn't exist or user not registered
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        # Get the contest or return 404 if not found
        contest = get_object_or_404(Contest, pk=pk)
        
        # Check if user is registered
        participation = Participation.objects.filter(user=request.user, contest=contest).first()
        if not participation:
            return Response(
                {"detail": "You are not registered for this contest."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Check if the contest has already started
        now = timezone.now()
        if contest.starting_time <= now:
            return Response(
                {"detail": "Cannot unregister from a contest that has already started."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Delete the participation record
        participation.delete()
        return Response(
            {"detail": f"Successfully unregistered from contest: {contest.name}"},
            status=status.HTTP_200_OK
        )

class ContestProblemByOrderView(APIView):
    """
    API endpoint for retrieving a specific problem in a contest by its order number
    
    Method: GET
    
    URL Parameters:
    - contest_id: Contest ID
    - order: Problem order number (1-based)
    
    Returns:
    - 200 OK: Problem details
    - 404 Not Found: Problem not found or user not registered
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, contest_id, order):
        # Get the contest or return 404 if not found
        contest = get_object_or_404(Contest, pk=contest_id)
        
        # Check if user is registered
        if not Participation.objects.filter(user=request.user, contest=contest).exists():
            return Response(
                {"detail": "You must be registered for this contest to view problems."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if the contest has started
        now = timezone.now()
        if contest.starting_time > now:
            return Response(
                {"detail": "Contest has not started yet."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the problem by its order
        contest_problem = ContestProblem.objects.filter(
            contest=contest
        ).order_by('order').first()

        if not contest_problem:
            return Response(
                {"detail": "Problem not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all problems to determine the current problem's order
        contest_problems = ContestProblem.objects.filter(contest=contest).order_by('order')
        problem_list = list(contest_problems)
        current_problem = None
        
        # Find the problem with the specified order
        for i, cp in enumerate(problem_list, 1):
            if i == order:
                current_problem = cp
                break
        
        if not current_problem:
            return Response(
                {"detail": "Problem not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize the problem
        serializer = ProblemSerializer(current_problem.problem)
        data = serializer.data
        data['order'] = order  # Add the order number to the response
        return Response(data)

class ContestProblemSubmitView(APIView):
    """
    API endpoint for submitting an answer to a contest problem
    
    Method: POST
    
    URL Parameters:
    - contest_id: Contest ID
    - order: Problem order number (1-based)
    
    Request Body:
    - answer: The submitted answer
    
    Returns:
    - 200 OK: Submission successful
    - 403 Forbidden: User not registered or contest not active
    - 404 Not Found: Problem not found
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, contest_id, order):
        try:
            logger.info(f"Attempting submission for contest {contest_id}, problem {order}")
            logger.info(f"Request data: {request.data}")
            
            # Get the contest or return 404 if not found
            contest = get_object_or_404(Contest, pk=contest_id)
            logger.info(f"Found contest: {contest.name}")
            
            # Check if user is registered
            participation = Participation.objects.filter(user=request.user, contest=contest).first()
            if not participation:
                logger.warning(f"User {request.user.id} not registered for contest {contest_id}")
                return Response(
                    {"detail": "You must be registered for this contest to submit answers."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if the contest is active
            now = timezone.now()
            if contest.starting_time > now:
                logger.warning(f"Contest {contest_id} has not started yet")
                return Response(
                    {"detail": "Contest has not started yet."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            contest_end = contest.starting_time + timezone.timedelta(minutes=contest.duration)
            if now > contest_end:
                logger.warning(f"Contest {contest_id} has ended")
                return Response(
                    {"detail": "Contest has ended."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get the contest problem
            try:
                contest_problem = ContestProblem.objects.get(
                    contest=contest,
                    order=order
                )
                logger.info(f"Found contest problem: {contest_problem.problem.title}")
            except ContestProblem.DoesNotExist:
                logger.error(f"Contest problem not found for contest {contest_id}, order {order}")
                return Response(
                    {"detail": "Problem not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user has already submitted a correct answer
            previous_correct_submission = Submission.objects.filter(
                user=request.user,
                problem=contest_problem.problem,
                evaluation_status='Correct'
            ).exists()
            
            if previous_correct_submission:
                return Response(
                    {"detail": "You have already submitted a correct answer for this problem."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Compare the submitted answer with the problem's answer (case-insensitive)
            submitted_answer = request.data.get('answer', '').strip().lower()
            correct_answer = contest_problem.problem.answer.strip().lower()
            is_correct = submitted_answer == correct_answer
            logger.info(f"Answer comparison - Submitted: {submitted_answer}, Correct: {correct_answer}, Result: {is_correct}")
            
            # Update participation stats
            participation.last_submission_time = now
            participation.submissions_count += 1
            if is_correct:
                participation.score += contest_problem.points
            participation.save()
            logger.info(f"Updated participation stats - Score: {participation.score}, Submissions: {participation.submissions_count}")
            
            # Create a submission record
            submission_data = {
                'content': request.data.get('answer', ''),
                'problem': contest_problem.problem.id,
                'evaluation_status': 'Correct' if is_correct else 'Wrong'
            }
            logger.info(f"Creating submission with data: {submission_data}")
            
            submission_serializer = SubmissionSerializer(data=submission_data)
            if submission_serializer.is_valid():
                submission_serializer.save(user=request.user)
                logger.info("Submission created successfully")
            else:
                logger.error(f"Invalid submission data: {submission_serializer.errors}")
                return Response(
                    {"detail": "Invalid submission data", "errors": submission_serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                "detail": "Answer submitted successfully",
                "correct": is_correct,
                "points_awarded": contest_problem.points if is_correct else 0,
                "already_correct": previous_correct_submission
            })
            
        except Exception as e:
            logger.error(f"Error in contest problem submission: {str(e)}", exc_info=True)
            return Response(
                {"detail": f"An error occurred while processing your submission: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ContestProblemSubmissionsView(APIView):
    """
    API endpoint for retrieving submissions for a contest problem
    
    Method: GET
    
    URL Parameters:
    - problem_id: Problem ID
    
    Returns:
    - 200 OK: List of submissions
    - 403 Forbidden: User not registered or contest not active
    - 404 Not Found: Problem not found
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, problem_id):
        try:
            # Get the problem
            problem = get_object_or_404(Problem, pk=problem_id)
            
            # Get the contest problem
            contest_problem = ContestProblem.objects.filter(problem=problem).first()
            if not contest_problem:
                return Response(
                    {"detail": "Problem not found in any contest."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user is registered for the contest
            participation = Participation.objects.filter(
                user=request.user,
                contest=contest_problem.contest
            ).first()
            
            if not participation:
                return Response(
                    {"detail": "You must be registered for this contest to view submissions."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get all submissions for this problem by the current user
            submissions = Submission.objects.filter(
                user=request.user,
                problem=problem
            ).order_by('-created_at')
            
            serializer = SubmissionSerializer(submissions, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching contest problem submissions: {str(e)}", exc_info=True)
            return Response(
                {"detail": f"An error occurred while fetching submissions: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )