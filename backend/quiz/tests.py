from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from documents.models import Document, DocumentChunk
from quiz.models import QuizSession, QuizQuestion, QuizAnswer

class QuizTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='quizuser',
            password='quizpassword123'
        )
        # Login
        login_url = reverse('auth_login')
        login_res = self.client.post(login_url, {
            'username': 'quizuser',
            'password': 'quizpassword123'
        })
        self.token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        
        # Create a document
        self.document = Document.objects.create(
            user=self.user,
            title="geography_doc.txt",
            file_type="TXT",
            extracted_text="The Nile is the longest river in the world, flowing through northeastern Africa. Mount Kilimanjaro is the highest mountain in Africa."
        )
        
        # Create a chunk
        self.chunk = DocumentChunk.objects.create(
            document=self.document,
            chunk_index=0,
            content="The Nile is the longest river in the world, flowing through northeastern Africa. Mount Kilimanjaro is the highest mountain in Africa."
        )
        
        self.quiz_list_url = reverse('quiz-list')

    def test_create_quiz_session(self):
        # 1. Post to create quiz session
        response = self.client.post(self.quiz_list_url, {
            'document_id': str(self.document.id),
            'question_count': 5,
            'difficulty': 'medium'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'in_progress')
        self.assertEqual(response.data['question_count'], 5)
        self.assertEqual(response.data['score_total'], 5)
        
        # Check DB
        session_id = response.data['id']
        session = QuizSession.objects.get(id=session_id)
        self.assertEqual(session.questions.count(), 5)
        
        # 2. Retrieve session and verify details (security check)
        retrieve_url = reverse('quiz-detail', args=[session.id])
        get_res = self.client.get(retrieve_url)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        
        questions = get_res.data['questions']
        self.assertEqual(len(questions), 5)
        
        # Confirm that correct answer and explanation fields are NOT directly on the question
        first_q = questions[0]
        self.assertNotIn('correct_option', first_q)
        self.assertNotIn('explanation_correct', first_q)
        self.assertNotIn('explanation_wrong', first_q)
        self.assertIsNone(first_q['user_answer'])

    def test_submit_answer_and_retrieve(self):
        # Create session
        response = self.client.post(self.quiz_list_url, {
            'document_id': str(self.document.id),
            'question_count': 3,
            'difficulty': 'easy'
        })
        session_id = response.data['id']
        session = QuizSession.objects.get(id=session_id)
        first_question = session.questions.first()
        
        # Submit answer
        answer_url = reverse('quiz-submit-answer', args=[session.id])
        ans_res = self.client.post(answer_url, {
            'question_id': first_question.id,
            'selected_option': 'B'
        })
        
        self.assertEqual(ans_res.status_code, status.HTTP_201_CREATED)
        self.assertIn('is_correct', ans_res.data)
        self.assertEqual(ans_res.data['correct_option'], first_question.correct_option)
        self.assertEqual(ans_res.data['explanation_correct'], first_question.explanation_correct)
        
        # Verify answering again fails
        dup_res = self.client.post(answer_url, {
            'question_id': first_question.id,
            'selected_option': 'A'
        })
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Retrieve and verify answered question has details serialized, but unanswered doesn't
        retrieve_url = reverse('quiz-detail', args=[session.id])
        get_res = self.client.get(retrieve_url)
        
        questions = get_res.data['questions']
        # Question 1: should have user_answer populated with answers/explanations
        q1_serialized = next(q for q in questions if q['id'] == first_question.id)
        self.assertIsNotNone(q1_serialized['user_answer'])
        self.assertEqual(q1_serialized['user_answer']['selected_option'], 'B')
        self.assertEqual(q1_serialized['user_answer']['correct_option'], first_question.correct_option)
        
        # Other questions: user_answer should be None
        q2_serialized = next(q for q in questions if q['id'] != first_question.id)
        self.assertIsNone(q2_serialized['user_answer'])

    def test_complete_quiz_session(self):
        # Create session
        response = self.client.post(self.quiz_list_url, {
            'document_id': str(self.document.id),
            'question_count': 2,
            'difficulty': 'hard'
        })
        session_id = response.data['id']
        session = QuizSession.objects.get(id=session_id)
        
        questions = list(session.questions.all())
        
        # Answer first question correctly
        answer_url = reverse('quiz-submit-answer', args=[session.id])
        self.client.post(answer_url, {
            'question_id': questions[0].id,
            'selected_option': questions[0].correct_option  # Correct option
        })
        
        # Complete session
        complete_url = reverse('quiz-complete-session', args=[session.id])
        comp_res = self.client.post(complete_url, {
            'elapsed_seconds': 45
        })
        
        self.assertEqual(comp_res.status_code, status.HTTP_200_OK)
        self.assertEqual(comp_res.data['status'], 'completed')
        self.assertEqual(comp_res.data['score_correct'], 1)
        self.assertEqual(comp_res.data['score_total'], 2)
        self.assertEqual(comp_res.data['elapsed_seconds'], 45)
        
        # Verify retrieved session reveals all answers now
        retrieve_url = reverse('quiz-detail', args=[session.id])
        get_res = self.client.get(retrieve_url)
        
        for q in get_res.data['questions']:
            self.assertIsNotNone(q['user_answer'])
            self.assertIn('correct_option', q['user_answer'])
            self.assertIn('explanation_correct', q['user_answer'])

    def test_quiz_history_filtering(self):
        # Create session for this document
        self.client.post(self.quiz_list_url, {
            'document_id': str(self.document.id),
            'question_count': 2,
            'difficulty': 'easy'
        })
        
        # Create second document
        doc2 = Document.objects.create(
            user=self.user,
            title="second_doc.txt",
            file_type="TXT",
            extracted_text="Some other content here."
        )
        
        # Filter by document_id
        response = self.client.get(f"{self.quiz_list_url}?document_id={self.document.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        # Filter by other document
        response_doc2 = self.client.get(f"{self.quiz_list_url}?document_id={doc2.id}")
        self.assertEqual(response_doc2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response_doc2.data), 0)
