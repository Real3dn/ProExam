import logging
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError

from .models import QuizSession, QuizQuestion, QuizAnswer
from .serializers import (
    QuizSessionSerializer, 
    QuizSessionDetailSerializer, 
    QuizAnswerSerializer
)

logger = logging.getLogger(__name__)

class QuizSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return quiz sessions belonging to the current user
        queryset = QuizSession.objects.filter(user=self.request.user)
        
        # Optional filter by document_id
        document_id = self.request.query_params.get('document_id')
        if document_id:
            queryset = queryset.filter(document_id=document_id)
            
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizSessionDetailSerializer
        return QuizSessionSerializer

    @action(detail=True, methods=['post'], url_path='answer')
    def submit_answer(self, request, pk=None):
        session = self.get_object()
        
        if session.status == 'completed':
            return Response(
                {"error": "This quiz session has already been completed."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        question_id = request.data.get('question_id')
        selected_option = request.data.get('selected_option')
        
        if not question_id:
            return Response({"error": "question_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not selected_option:
            return Response({"error": "selected_option is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        selected_option = selected_option.upper()
        if selected_option not in ['A', 'B', 'C', 'D']:
            return Response({"error": "selected_option must be one of A, B, C, D."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Get the question and verify it belongs to this session
        question = get_object_or_404(session.questions, id=question_id)
        
        # Check if already answered
        if QuizAnswer.objects.filter(question=question).exists():
            return Response(
                {"error": "This question has already been answered."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Record answer (save() automatically grades the answer)
        answer = QuizAnswer.objects.create(
            question=question,
            selected_option=selected_option
        )
        
        return Response({
            "is_correct": answer.is_correct,
            "correct_option": question.correct_option,
            "explanation_correct": question.explanation_correct,
            "explanation_wrong": question.explanation_wrong
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='complete')
    def complete_session(self, request, pk=None):
        session = self.get_object()
        
        if session.status == 'completed':
            # Already completed, just return details
            serializer = QuizSessionDetailSerializer(session)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        elapsed_seconds = request.data.get('elapsed_seconds', 0)
        try:
            elapsed_seconds = int(elapsed_seconds)
        except (ValueError, TypeError):
            elapsed_seconds = 0
            
        # Calculate scores
        score_correct = session.questions.filter(user_answer__is_correct=True).count()
        
        session.status = 'completed'
        session.score_correct = score_correct
        session.elapsed_seconds = elapsed_seconds
        session.completed_at = timezone.now()
        session.save()
        
        serializer = QuizSessionDetailSerializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)
