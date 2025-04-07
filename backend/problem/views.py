from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Problem, ProblemGenre, Submission
from .serializers import ProblemSerializer, SubmissionSerializer
from rest_framework.pagination import PageNumberPagination


class ProblemCreateView(APIView):
    """
    API endpoint for creating a new problem.

    Permissions:
    - Only authenticated users can access this endpoint.

    Request Body:
    - title (str): Title of the problem (required).
    - description (str): Description of the problem (required).
    - genre_names (list of str): List of genres associated with the problem (optional).

    Example JSON Request:
    {
        "title": "Sample Problem",
        "description": "This is a sample problem description.",
        "genre_names": ["Math", "Algorithms"]
    }

    Response:
    - 201 Created: Returns the created problem data.
    - 400 Bad Request: Returns validation errors if the request is invalid.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.copy()
        genre_names = data.pop('genre_names', None)
        
        if genre_names:
            genres = []
            for name in genre_names:
                genre, created = ProblemGenre.objects.get_or_create(name=name.lower().strip())
                genres.append(genre.id)
            data['genre_ids'] = genres
        
        serializer = ProblemSerializer(data=data)
        if serializer.is_valid():
            serializer.save(creator=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ProblemPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    
class ProblemListView(ListAPIView):
    """
    API endpoint for listing all problems.

    Permissions:
    - Only authenticated users can access this endpoint.

    Query Parameters:
    - genre (list of str): Filter problems by genre names (optional).

    Example JSON Request:
    {
        "genre": ["Math", "Algorithms"]
    }

    Response:
    - Paginated list of problems with their details.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = ProblemPagination
    serializer_class = ProblemSerializer

    def get(self, request):
        data = request.data.copy()
        genres = data.pop('genre', None)

        queryset = Problem.objects.all()
        if genres:
            for genre in genres:
                queryset = Problem.objects.filter(genre__name__icontains=genre)            

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class SubmissionCreateView(APIView):
    """
    API endpoint for creating a new submission for a specific problem.

    Permissions:
    - Only authenticated users can access this endpoint.

    Example JSON Request:
    {
        "content":"Answer"
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, problem_id):
        try:
            problem = Problem.objects.get(id=problem_id)
        except Problem.DoesNotExist:
            return Response({"error": "Problem not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['problem'] = problem_id

        serializer = SubmissionSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SubmissionListView(ListAPIView):
    """
    API endpoint for listing all submissions for a specific problem.

    Permissions:
    - Only authenticated users can access this endpoint.

    Response:
    - List of all submissions for the given problem ID.

    Example JSON Request:
    No request body is required. The problem ID is passed as a URL parameter.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SubmissionSerializer

    def get(self, request, problem_id):
        queryset = Submission.objects.filter(problem_id=problem_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)