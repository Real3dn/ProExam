import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ChatSession, Message
from .serializers import ChatSessionSerializer, ChatSessionDetailSerializer, MessageSerializer
from documents.models import DocumentChunk
from .ai_utils import get_embedding, generate_chat_response, cosine_similarity

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_TEMPLATE = """You are a specialized document reading assistant. Your primary task is to answer user queries using ONLY the context provided below.

DOCUMENT CONTEXT:
=========================================
{context}
=========================================

RULES:
1. Answer the user's question accurately using ONLY the information provided in the DOCUMENT CONTEXT above.
2. If the answer to the question cannot be derived or found from the context, respond EXACTLY with:
   "I cannot find the answer to this in the document provided."
3. Do NOT make up facts, rely on external knowledge, or interpolate facts not explicitly written in the context.
4. Keep the tone professional, objective, and clear. Maintain markdown formatting for readability.
"""

class ChatSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Restrict chat sessions to the current user
        return ChatSession.objects.filter(user=self.request.user).order_by('-updated_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ChatSessionDetailSerializer
        return ChatSessionSerializer

    @action(detail=True, methods=['post'], url_path='messages')
    def send_message(self, request, pk=None):
        session = self.get_object()
        user_content = request.data.get('content')
        
        if not user_content:
            return Response({"error": "Content is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # 1. Save user message
        user_message = Message.objects.create(
            session=session,
            sender='user',
            content=user_content
        )
        
        # 2. Get embedding of user query
        query_embedding = get_embedding(user_content)
        
        # 3. Retrieve chunks of the document
        chunks = DocumentChunk.objects.filter(document=session.document)
        
        relevant_chunks = []
        if chunks.exists() and query_embedding:
            # Calculate similarity for each chunk
            scored_chunks = []
            for chunk in chunks:
                if chunk.embedding:
                    sim = cosine_similarity(query_embedding, chunk.embedding)
                    scored_chunks.append((sim, chunk))
            
            # Sort by similarity descending
            scored_chunks.sort(key=lambda x: x[0], reverse=True)
            
            # Take top 3 chunks
            top_chunks = scored_chunks[:3]
            relevant_chunks = [item[1].content for item in top_chunks]
            
        context_str = "\n\n---\n\n".join(relevant_chunks) if relevant_chunks else "No document context is available."
        
        # 4. Construct System Instruction
        system_instruction = SYSTEM_PROMPT_TEMPLATE.format(context=context_str)
        
        # 5. Get recent chat history (excluding the current user message we just saved)
        # Fetch last 10 messages
        history_msgs = Message.objects.filter(session=session).exclude(id=user_message.id).order_by('-created_at')[:10]
        # Reverse to get chronological order
        history_msgs = list(reversed(history_msgs))
        
        # Format history for Gemini
        chat_history = []
        for msg in history_msgs:
            role = 'user' if msg.sender == 'user' else 'model'
            chat_history.append({'role': role, 'text': msg.content})
            
        # 6. Generate AI response
        ai_content = generate_chat_response(
            system_instruction=system_instruction,
            chat_history=chat_history,
            user_message=user_content
        )
        
        # 7. Save AI message
        ai_message = Message.objects.create(
            session=session,
            sender='ai',
            content=ai_content
        )
        
        # Update session timestamp to float it to top of dashboard
        session.save() # triggers auto_now on updated_at
        
        return Response({
            "user_message": MessageSerializer(user_message).data,
            "ai_message": MessageSerializer(ai_message).data
        }, status=status.HTTP_201_CREATED)
