from rest_framework import serializers
from .models import Problem, ProblemGenre


class ProblemGenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProblemGenre
        fields = ['id', 'name']


class ProblemSerializer(serializers.ModelSerializer):
    genre = ProblemGenreSerializer(many=True, read_only=True)
    genre_ids = serializers.PrimaryKeyRelatedField(
        queryset=ProblemGenre.objects.all(),
        many=True,
        source='genre',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Problem
        fields = ['id', 'title', 'question', 'answer', 'genre', 'genre_ids', 'created_at']
        read_only_fields = ['id', 'created_at']
        
    def create(self, validated_data):
        genre_data = validated_data.pop('genre', [])
        problem = Problem.objects.create(**validated_data)
        
        if genre_data:
            problem.genre.set(genre_data)
            
        return problem
        
    def update(self, instance, validated_data):
        genre_data = validated_data.pop('genre', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if genre_data is not None:
            instance.genre.set(genre_data)
            
        instance.save()
        return instance