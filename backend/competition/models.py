from django.db import models
from django.conf import settings


class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Contest(models.Model):
    name = models.CharField(max_length=100)
    starting_time = models.DateTimeField()
    duration = models.DurationField()
    genres = models.ManyToManyField(Genre, related_name='contests')
    description = models.TextField()
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_contests')
    
    def __str__(self):
        return self.name