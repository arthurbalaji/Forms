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
    class Meta:
        model = FormResponse
        fields = ['id', 'form', 'respondent', 'response_data', 'submitted_at']
        read_only_fields = ['respondent', 'submitted_at']

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