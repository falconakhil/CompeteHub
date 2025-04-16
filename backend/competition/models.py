from django.db import models
from django.conf import settings
from datetime import timedelta
from problem.models import Problem


class ContestGenre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name


class Contest(models.Model):
    name = models.CharField(max_length=100)
    starting_time = models.DateTimeField()
    duration = models.DurationField(default=timedelta(hours=1))
    genres = models.ManyToManyField(ContestGenre, related_name='contests')
    description = models.TextField()
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_contests')
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, through='Participation', related_name='participated_contests')
    problems = models.ManyToManyField(Problem, through='ContestProblem', related_name='contests')
    
    def __str__(self):
        return self.name


class ContestProblem(models.Model):
    """
    Represents a problem included in a contest with associated points
    """
    contest = models.ForeignKey(Contest, on_delete=models.CASCADE)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    points = models.PositiveIntegerField(default=100, help_text="Points awarded for solving this problem")
    order = models.PositiveIntegerField(default=0, help_text="Order of the problem in the contest")
    
    class Meta:
        unique_together = ['contest', 'problem']
        ordering = ['order']
    
    def __str__(self):
        return f"{self.problem.title} in {self.contest.name} ({self.points} points)"


class Participation(models.Model):
    """
    Represents a participant's registration and performance in a specific contest
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    contest = models.ForeignKey(Contest, on_delete=models.CASCADE)
    registration_time = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(default=0)
    rank = models.IntegerField(null=True, blank=True)
    
    # Additional fields to track participant activity
    last_submission_time = models.DateTimeField(null=True, blank=True)
    submissions_count = models.IntegerField(default=0)
    
    class Meta:
        unique_together = ['user', 'contest']
        ordering = ['-score', 'last_submission_time']
    
    def __str__(self):
        return f"{self.user.username} in {self.contest.name}"