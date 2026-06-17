from rest_framework import serializers
from .models import ChatSession, Message
from documents.serializers import DocumentSerializer

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ('id', 'sender', 'content', 'created_at')

class ChatSessionSerializer(serializers.ModelSerializer):
    document = DocumentSerializer(read_only=True)
    document_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ChatSession
        fields = ('id', 'document', 'document_id', 'title', 'created_at', 'updated_at')
        read_only_fields = ('id', 'title', 'created_at', 'updated_at')

    def create(self, validated_data):
        doc_id = validated_data.pop('document_id')
        user = self.context['request'].user
        
        # Resolve document and make sure it belongs to the user
        from documents.models import Document
        try:
            document = Document.objects.get(id=doc_id, user=user)
        except Document.DoesNotExist:
            raise serializers.ValidationError("Document not found or access denied.")
            
        chat_session = ChatSession.objects.create(
            user=user,
            document=document,
            title=f"Chat on {document.title}",
            **validated_data
        )
        return chat_session

class ChatSessionDetailSerializer(serializers.ModelSerializer):
    document = DocumentSerializer(read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ('id', 'document', 'title', 'messages', 'created_at', 'updated_at')
