import io
from django.contrib.auth.models import User
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Document, DocumentChunk
from .utils import chunk_text

class DocumentTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='docuser',
            password='docpassword123'
        )
        # Login
        login_url = reverse('auth_login')
        login_res = self.client.post(login_url, {
            'username': 'docuser',
            'password': 'docpassword123'
        })
        self.token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        self.upload_url = reverse('document-list')

    def test_chunk_text_utility(self):
        # 10 words
        text = "one two three four five six seven eight nine ten"
        # chunk size 4 words, overlap 1 word
        # chunk 1: "one two three four" (i=0)
        # chunk 2: "four five six seven" (i=3)
        # chunk 3: "seven eight nine ten" (i=6)
        chunks = chunk_text(text, chunk_size_words=4, overlap_words=1)
        self.assertEqual(len(chunks), 3)
        self.assertEqual(chunks[0], "one two three four")
        self.assertEqual(chunks[1], "four five six seven")
        self.assertEqual(chunks[2], "seven eight nine ten")

        # Test empty input
        self.assertEqual(chunk_text(""), [])

    def test_upload_text_file(self):
        file_content = b"This is a sample text file contents. It should be extracted and chunked correctly."
        uploaded_file = SimpleUploadedFile("sample.txt", file_content, content_type="text/plain")
        
        response = self.client.post(self.upload_url, {'file': uploaded_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify Document record
        doc = Document.objects.get(id=response.data['id'])
        self.assertEqual(doc.title, "sample.txt")
        self.assertEqual(doc.file_type, "TXT")
        self.assertEqual(doc.extracted_text, file_content.decode('utf-8'))
        
        # Verify Chunks record
        chunks = DocumentChunk.objects.filter(document=doc)
        self.assertTrue(chunks.exists())
        self.assertEqual(chunks.first().content, doc.extracted_text)

    def test_list_documents(self):
        # Create a document record manually
        doc = Document.objects.create(
            user=self.user,
            title="dummy.txt",
            file_type="TXT",
            extracted_text="dummy text"
        )
        
        response = self.client.get(self.upload_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "dummy.txt")

    def test_delete_document(self):
        doc = Document.objects.create(
            user=self.user,
            title="dummy.txt",
            file_type="TXT",
            extracted_text="dummy text"
        )
        
        delete_url = reverse('document-detail', args=[doc.id])
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Document.objects.filter(id=doc.id).exists())
