from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import CompetitorSerializer

class SignUp(APIView):
    permission_classes=[AllowAny]
    def post(self, request):
        serializer = CompetitorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        else:
            return Response(serializer.errors, status=400)