import random
from rest_framework import serializers
from .models import QuizSession, QuizQuestion, QuizAnswer
from documents.serializers import DocumentSerializer

class QuizAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAnswer
        fields = ('selected_option', 'is_correct', 'answered_at')


class QuizQuestionPublicSerializer(serializers.ModelSerializer):
    user_answer = serializers.SerializerMethodField()

    class Meta:
        model = QuizQuestion
        fields = (
            'id', 'question_index', 'question_text', 
            'option_a', 'option_b', 'option_c', 'option_d', 
            'user_answer'
        )

    def get_user_answer(self, obj):
        # Expose correct options and explanations only after the question is answered,
        # or if the entire quiz session is completed.
        session_completed = (obj.session.status == 'completed')
        try:
            ans = obj.user_answer
            return {
                'selected_option': ans.selected_option,
                'is_correct': ans.is_correct,
                'correct_option': obj.correct_option,
                'explanation_correct': obj.explanation_correct,
                'explanation_wrong': obj.explanation_wrong
            }
        except QuizAnswer.DoesNotExist:
            if session_completed:
                return {
                    'selected_option': None,
                    'is_correct': False,
                    'correct_option': obj.correct_option,
                    'explanation_correct': obj.explanation_correct,
                    'explanation_wrong': obj.explanation_wrong
                }
            return None


class QuizSessionSerializer(serializers.ModelSerializer):
    document_id = serializers.UUIDField(write_only=True)
    document_title = serializers.CharField(source='document.title', read_only=True)

    class Meta:
        model = QuizSession
        fields = (
            'id', 'document_id', 'document_title', 'difficulty', 'question_count', 
            'status', 'score_correct', 'score_total', 'elapsed_seconds', 
            'created_at', 'completed_at'
        )
        read_only_fields = (
            'id', 'status', 'score_correct', 'score_total', 
            'elapsed_seconds', 'created_at', 'completed_at'
        )

    def create(self, validated_data):
        doc_id = validated_data.pop('document_id')
        user = self.context['request'].user
        
        from documents.models import Document
        try:
            document = Document.objects.get(id=doc_id, user=user)
        except Document.DoesNotExist:
            raise serializers.ValidationError("Document not found or access denied.")
            
        session = QuizSession.objects.create(
            user=user,
            document=document,
            **validated_data
        )
        
        # Trigger AI generation
        from chat.ai_utils import generate_quiz_questions
        questions_data = generate_quiz_questions(document, session.question_count, session.difficulty)
        
        # Shuffle questions order
        random.shuffle(questions_data)
        
        # Shuffle options within each question and save
        for i, q_data in enumerate(questions_data):
            shuffled = self._shuffle_options(q_data)
            QuizQuestion.objects.create(
                session=session,
                question_index=i,
                question_text=shuffled['question_text'],
                option_a=shuffled['option_a'],
                option_b=shuffled['option_b'],
                option_c=shuffled['option_c'],
                option_d=shuffled['option_d'],
                correct_option=shuffled['correct_option'],
                explanation_correct=q_data.get('explanation_correct', ''),
                explanation_wrong=q_data.get('explanation_wrong', '')
            )
        
        # Update score total based on how many questions were actually created
        session.score_total = len(questions_data)
        session.save()
        
        return session

    def _shuffle_options(self, q_data):
        original_options = [
            ('A', q_data.get('option_a', '')),
            ('B', q_data.get('option_b', '')),
            ('C', q_data.get('option_c', '')),
            ('D', q_data.get('option_d', '')),
        ]
        correct_letter = q_data.get('correct_option', 'A').upper()
        
        # Locate the correct option text
        correct_text = next((text for letter, text in original_options if letter == correct_letter), '')
        
        # Shuffle option texts
        option_texts = [text for letter, text in original_options]
        random.shuffle(option_texts)
        
        # Locate new correct letter
        try:
            new_correct_index = option_texts.index(correct_text)
        except ValueError:
            new_correct_index = 0
            
        new_correct_letter = ['A', 'B', 'C', 'D'][new_correct_index]
        
        return {
            'question_text': q_data.get('question', ''),
            'option_a': option_texts[0],
            'option_b': option_texts[1],
            'option_c': option_texts[2],
            'option_d': option_texts[3],
            'correct_option': new_correct_letter
        }


class QuizSessionDetailSerializer(serializers.ModelSerializer):
    document = DocumentSerializer(read_only=True)
    questions = QuizQuestionPublicSerializer(many=True, read_only=True)

    class Meta:
        model = QuizSession
        fields = (
            'id', 'document', 'difficulty', 'question_count', 'status', 
            'score_correct', 'score_total', 'elapsed_seconds', 
            'questions', 'created_at', 'completed_at'
        )
