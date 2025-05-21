from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Form, FormResponse

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')
        
class FormSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    
    class Meta:
        model = Form
        fields = '__all__'
        read_only_fields = ('owner',)

class FormResponseSerializer(serializers.ModelSerializer):
    respondent_username = serializers.CharField(source='respondent.username', read_only=True)
    # Expose download URLs for file answers
    file_urls = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = FormResponse
        fields = ['id', 'form', 'respondent', 'respondent_username', 'response_data', 'submitted_at', 'file_urls']
        read_only_fields = ['respondent', 'submitted_at', 'file_urls']

    def get_file_urls(self, obj):
        # Returns a dict: {question_id: download_url}
        request = self.context.get('request')
        if not obj.uploaded_files:
            return {}
        return {
            qid: request.build_absolute_uri(f"/api/forms/{obj.form.id}/responses/{obj.id}/download/{qid}/")
            for qid in obj.uploaded_files
        }

    def validate_form(self, value):
        # Add any form-specific validation here if needed
        return value

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password')
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user