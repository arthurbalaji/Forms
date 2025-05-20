from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import login, logout
from django.http import HttpResponse
import csv

from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404

from django.contrib.auth import authenticate
import json
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import Form, FormResponse
from .serializers import (
    FormSerializer, 
    FormResponseSerializer, 
    UserRegisterSerializer,
    UserSerializer
)

class FormViewSet(viewsets.ModelViewSet):
    serializer_class = FormSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.action == 'list':
            return Form.objects.filter(owner=self.request.user)
        return Form.objects.all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'])
    def responses(self, request, pk=None):
        form = self.get_object()
        if form.owner != request.user:
            return Response(
                {"error": "Not authorized to view responses"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        responses = form.responses.all()
        serializer = FormResponseSerializer(responses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def export_csv(self, request, pk=None):
        form = self.get_object()
        if form.owner != request.user:
            return Response(
                {"error": "Not authorized to export responses"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{form.title}_responses.csv"'
        
        writer = csv.writer(response)
        questions = form.questions
        headers = ['Respondent', 'Submitted At'] + [q['label'] for q in questions]
        writer.writerow(headers)
        
        for form_response in form.responses.all():
            row = [
                form_response.respondent.username if form_response.respondent else 'Anonymous',
                form_response.submitted_at.strftime('%Y-%m-%d %H:%M:%S')
            ]
            for question in questions:
                answer = form_response.response_data.get(str(question['id']), '')
                row.append(answer)
            writer.writerow(row)
        
        return response

class FormResponseViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, form_pk=None):
        form = get_object_or_404(Form, pk=form_pk)
        if form.owner != request.user:
            return Response(
                {"error": "Not authorized to view responses"},
                status=status.HTTP_403_FORBIDDEN
            )
        responses = FormResponse.objects.filter(form_id=form_pk)
        serializer = FormResponseSerializer(responses, many=True)
        return Response(serializer.data)

    def create(self, request, form_pk=None):
        form = get_object_or_404(Form, pk=form_pk)
        data = {
            'form': form_pk,
            'response_data': request.data.get('response_data', {})
        }
        serializer = FormResponseSerializer(data=data)
        if serializer.is_valid():
            serializer.save(respondent=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class AuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = get_token(request)
        return Response({
            'csrfToken': token,
            'isAuthenticated': request.user.is_authenticated,
            'user': UserSerializer(request.user).data if request.user.is_authenticated else None
        })

    def post(self, request):
        action = request.data.get('action')
        
        if action == 'register':
            serializer = UserRegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                login(request, user)
                return Response(UserSerializer(user).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif action == 'login':
            username = request.data.get('username')
            password = request.data.get('password')
            user = authenticate(username=username, password=password)
            
            if user:
                login(request, user)
                return Response(UserSerializer(user).data)
            return Response(
                {"error": "Invalid credentials"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        elif action == 'logout':
            logout(request)
            return Response({"message": "Logged out successfully"})

        return Response(
            {"error": "Invalid action"}, 
            status=status.HTTP_400_BAD_REQUEST
        )