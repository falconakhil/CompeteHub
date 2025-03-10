from rest_framework import serializers
from .models import Contest, Genre


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name']


class ContestSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    genre_ids = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(),
        many=True,
        source='genres',
        write_only=True
    )
    
    creator_username = serializers.ReadOnlyField(source='creator.user.username')
    
    class Meta:
        model = Contest
        fields = ['id', 'name', 'starting_time', 'duration', 'genres', 'genre_ids', 
                  'description', 'creator', 'creator_username']
        read_only_fields = ['id', 'creator', 'creator_username']