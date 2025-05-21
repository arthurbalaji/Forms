from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import login, logout
from django.http import HttpResponse, FileResponse, Http404
import csv

from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404

from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import Form, FormResponse
from .serializers import (
    FormSerializer, 
    FormResponseSerializer, 
    UserRegisterSerializer,
    UserSerializer
)

import os
from django.conf import settings

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
                qid = str(question['id'])
                answer = form_response.response_data.get(qid, '')
                # If file question, show download url
                if question['type'] == 'file' and qid in form_response.uploaded_files:
                    url = request.build_absolute_uri(f"/api/forms/{form.id}/responses/{form_response.id}/download/{qid}/")
                    answer = url
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
        serializer = FormResponseSerializer(responses, many=True, context={'request': request})
        return Response(serializer.data)

    def create(self, request, form_pk=None):
        form = get_object_or_404(Form, pk=form_pk)
        # Support multipart/form-data for file uploads
        data = dict(request.data)
        response_data = data.get('response_data')
        # Parse if sent as JSON string
        import json as pyjson
        if isinstance(response_data, list) and len(response_data) == 1 and isinstance(response_data[0], str):
            response_data = pyjson.loads(response_data[0])
        elif isinstance(response_data, str):
            response_data = pyjson.loads(response_data)
        elif not response_data:
            response_data = {}

        # Save response first to get an ID
        resp = FormResponse.objects.create(
            form=form,
            respondent=request.user,
            response_data=response_data,
        )
        # Now handle file uploads
        uploaded_files = {}
        for question in form.questions:
            if question['type'] == 'file':
                qid = str(question['id'])
                f = request.FILES.get(qid)
                if f:
                    upload_dir = os.path.join(settings.MEDIA_ROOT, f'form_files/form_{form.id}/response_{resp.id}')
                    os.makedirs(upload_dir, exist_ok=True)
                    file_path = os.path.join(upload_dir, f.name)
                    with open(file_path, 'wb+') as dest:
                        for chunk in f.chunks():
                            dest.write(chunk)
                    uploaded_files[qid] = file_path
        if uploaded_files:
            resp.uploaded_files = uploaded_files
            resp.save()

        serializer = FormResponseSerializer(resp, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='download/(?P<question_id>[^/.]+)')
    def download_file(self, request, form_pk=None, pk=None, question_id=None):
        form = get_object_or_404(Form, pk=form_pk)
        resp = get_object_or_404(FormResponse, pk=pk, form=form)
        # Only form owner can download
        if form.owner != request.user:
            return Response({"error": "Not authorized"}, status=403)
        file_path = resp.uploaded_files.get(question_id)
        if file_path and os.path.exists(file_path):
            filename = os.path.basename(file_path)
            return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=filename)
        raise Http404("File not found")


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