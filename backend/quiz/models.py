import uuid
from django.db import models
from django.contrib.auth.models import User
from documents.models import Document

class QuizSession(models.Model):
    DIFFICULTY_CHOICES = (
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    )

    STATUS_CHOICES = (
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_sessions')
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='quiz_sessions')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    question_count = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    score_correct = models.IntegerField(default=0)
    score_total = models.IntegerField(default=0)
    elapsed_seconds = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.document.title} ({self.difficulty}) - {self.status}"


class QuizQuestion(models.Model):
    session = models.ForeignKey(QuizSession, on_delete=models.CASCADE, related_name='questions')
    question_index = models.IntegerField()
    question_text = models.TextField()
    option_a = models.TextField()
    option_b = models.TextField()
    option_c = models.TextField()
    option_d = models.TextField()
    correct_option = models.CharField(max_length=1)  # 'A', 'B', 'C', or 'D'
    explanation_correct = models.TextField()
    explanation_wrong = models.TextField()

    class Meta:
        ordering = ['question_index']

    def __str__(self):
        return f"Q{self.question_index + 1}: {self.question_text[:50]}..."


class QuizAnswer(models.Model):
    question = models.OneToOneField(QuizQuestion, on_delete=models.CASCADE, related_name='user_answer')
    selected_option = models.CharField(max_length=1)  # 'A', 'B', 'C', or 'D'
    is_correct = models.BooleanField()
    answered_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Automatically determine is_correct based on the linked question's correct_option
        self.is_correct = (self.selected_option.upper() == self.question.correct_option.upper())
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Answer for Q{self.question.question_index + 1} - Selected: {self.selected_option} (Correct: {self.is_correct})"
