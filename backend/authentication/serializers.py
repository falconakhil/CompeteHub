import rest_framework.serializers as serializers
from .models import Competitor
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from competition.models import Contest, Participation


class CompetitorSerializer(serializers.ModelSerializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    contests_participated = serializers.SerializerMethodField()
    contests_hosted = serializers.SerializerMethodField()
    problems_solved = serializers.SerializerMethodField()

    class Meta:
        model = Competitor
        fields = ['id', 'username', 'email', 'password', 'contests_participated', 'contests_hosted', 'problems_solved']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def get_contests_participated(self, obj):
        return Participation.objects.filter(user=obj).count()

    def get_contests_hosted(self, obj):
        return Contest.objects.filter(creator=obj).count()

    def get_problems_solved(self, obj):
        # Get unique problems solved across all participations
        participations = Participation.objects.filter(user=obj)
        total_solved = sum(p.submissions_count for p in participations)
        return total_solved

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Competitor.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=password
        )
        return user