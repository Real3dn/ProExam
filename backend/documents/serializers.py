from rest_framework import serializers
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ('id', 'title', 'file', 'file_type', 'created_at', 'updated_at')
        read_only_fields = ('id', 'title', 'file_type', 'created_at', 'updated_at')

    def validate_file(self, value):
        ext = value.name.split('.')[-1].lower()
        if ext not in ['pdf', 'docx', 'txt']:
            raise serializers.ValidationError("Only PDF, DOCX, and TXT files are allowed.")
        return value
