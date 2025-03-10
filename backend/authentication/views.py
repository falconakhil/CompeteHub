from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny,IsAuthenticated
from .serializers import CompetitorSerializer
from django.contrib.auth import authenticate


class SignUp(APIView):
    permission_classes=[AllowAny]
    def post(self, request):
        serializer = CompetitorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        else:
            return Response(serializer.errors, status=400)
        
class UserProfile(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        serializer = CompetitorSerializer(user)
        data=serializer.data
        if 'password' in data:
            del data['password']
        return Response(data, status=200)
    
class DeleteUser(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        user = request.user
        password = request.data.get('password')
        
        if not password:
            return Response({"error": "Password is required to delete account"}, status=400)
            
        # Verify the password
        auth_user = authenticate(username=user.username, password=password)
        
        if auth_user is None:
            return Response({"error": "Incorrect password"}, status=403)
            
        # Password is correct, delete the user
        user.delete()
        return Response({"message": "User account successfully deleted"}, status=200)