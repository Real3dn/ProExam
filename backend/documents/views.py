import logging
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Document, DocumentChunk
from .serializers import DocumentSerializer
from .utils import extract_document_text, chunk_text
from chat.ai_utils import get_embedding

logger = logging.getLogger(__name__)

class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer

    def get_queryset(self):
        # Restrict queryset to the current user's documents
        return Document.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # The file field is validated and parsed in the serializer
        file_obj = self.request.FILES.get('file')
        title = file_obj.name
        ext = title.split('.')[-1].upper()
        if ext == 'PDF':
            file_type = 'PDF'
        elif ext == 'DOCX':
            file_type = 'DOCX'
        else:
            file_type = 'TXT'

        # First, save the document object to persist the file on disk
        document = serializer.save(user=self.request.user, title=title, file_type=file_type)

        try:
            # Extract plain text from file path
            file_path = document.file.path
            extracted_text = extract_document_text(file_path, file_type)
            document.extracted_text = extracted_text
            document.save()

            # Generate chunks
            chunks = chunk_text(extracted_text)
            
            if chunks:
                # Batch generate embeddings to optimize round trips
                embeddings = get_embedding(chunks)
                
                # Bulk save chunks
                chunk_objs = []
                for idx, (content, emb) in enumerate(zip(chunks, embeddings)):
                    chunk_objs.append(
                        DocumentChunk(
                            document=document,
                            chunk_index=idx,
                            content=content,
                            embedding=emb
                        )
                    )
                DocumentChunk.objects.bulk_create(chunk_objs)
                logger.info(f"Successfully processed and chunked document: {title}. Chunks created: {len(chunk_objs)}")
            else:
                logger.warning(f"No text content could be extracted from document: {title}")
        except Exception as e:
            logger.error(f"Error parsing and embedding document {title}: {str(e)}")
            # In case of fatal parsing error, we keep the document but it has empty extracted_text
