from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Problem, ProblemGenre
from .serializers import ProblemSerializer
from rest_framework.pagination import PageNumberPagination


class ProblemCreateView(APIView):
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
    API endpoint for listing all problems
    """
    permission_classes = [IsAuthenticated]
    pagination_class = ProblemPagination
    serializer_class = ProblemSerializer

    def get(self, request):
        data=request.data.copy()
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