from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from documents.models import Document, DocumentChunk
from chat.models import ChatSession, Message

class ChatTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='chatuser',
            password='chatpassword123'
        )
        # Login
        login_url = reverse('auth_login')
        login_res = self.client.post(login_url, {
            'username': 'chatuser',
            'password': 'chatpassword123'
        })
        self.token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        
        # Create a document
        self.document = Document.objects.create(
            user=self.user,
            title="test_doc.txt",
            file_type="TXT",
            extracted_text="This is a test document about bananas. Bananas are yellow fruits rich in potassium."
        )
        
        # Create a chunk manually
        self.chunk = DocumentChunk.objects.create(
            document=self.document,
            chunk_index=0,
            content="This is a test document about bananas. Bananas are yellow fruits rich in potassium.",
            embedding=[0.1] * 768
        )
        
        self.session_list_url = reverse('chat-list')

    def test_create_chat_session(self):
        response = self.client.post(self.session_list_url, {
            'document_id': str(self.document.id)
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['document']['title'], self.document.title)
        
        # Check database
        session_id = response.data['id']
        self.assertTrue(ChatSession.objects.filter(id=session_id).exists())

    def test_send_message_in_session(self):
        # Create session
        session = ChatSession.objects.create(
            user=self.user,
            document=self.document,
            title="Chat session test"
        )
        
        send_url = reverse('chat-send-message', args=[session.id])
        
        response = self.client.post(send_url, {
            'content': 'What color are bananas?'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user_message', response.data)
        self.assertIn('ai_message', response.data)
        
        # Verify Message records in DB
        messages = Message.objects.filter(session=session).order_by('created_at')
        self.assertEqual(messages.count(), 2)
        self.assertEqual(messages[0].sender, 'user')
        self.assertEqual(messages[0].content, 'What color are bananas?')
        self.assertEqual(messages[1].sender, 'ai')
        # Response content should be dummy string or actual API response
        self.assertTrue(len(messages[1].content) > 0)
