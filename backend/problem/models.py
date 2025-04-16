from django.db import models
from django.conf import settings

class ProblemGenre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name


class Problem(models.Model):    
    title = models.CharField(max_length=200, help_text="Title of the question")
    question = models.TextField(help_text="Question content")
    answer = models.TextField(help_text="Correct answer for the question")
    genre = models.ManyToManyField(ProblemGenre, related_name='problem')
    created_at = models.DateTimeField(auto_now_add=True)
    eval_type=models.IntegerField(default=0, help_text="Evaluation type: 0 for code, 1 for text, 2 for no auto eval")
    creator=models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_problems')
    
    def __str__(self):
        """String representation of the Question object."""
        return self.title
    
    class Meta:
        ordering = ['-created_at']

class Submission(models.Model):
    STATUS_CHOICES = [
        ('Correct', 'Correct'),
        ('Wrong', 'Wrong'),
        ('Unknown', 'Unknown'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="submissions")
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name="submissions")
    content = models.TextField(help_text="The submitted solution/content")
    score=models.FloatField(default=0, help_text="Score of the submission")  # New field added
    evaluation_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Unknown')
    remarks = models.TextField(blank=True, null=True, help_text="Additional remarks about the submission")  # New field added
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Submission by {self.user.username} for {self.problem.title} - {self.evaluation_status}"