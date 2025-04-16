from rest_framework import serializers
from datetime import timedelta
from .models import Contest, ContestGenre


class ContestGenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContestGenre
        fields = ['id', 'name']


class ContestSerializer(serializers.ModelSerializer):
    genres = ContestGenreSerializer(many=True, read_only=True)
    genre_ids = serializers.PrimaryKeyRelatedField(
        queryset=ContestGenre.objects.all(),
        many=True,
        source='genres',
        write_only=True
    )
    
    creator_username = serializers.ReadOnlyField(source='creator.username')
    duration = serializers.DurationField(help_text="Duration in minutes")
    
    class Meta:
        model = Contest
        fields = ['id', 'name', 'starting_time', 'duration', 'genres', 'genre_ids', 
                  'description', 'creator', 'creator_username']
        read_only_fields = ['id', 'creator', 'creator_username']