from django.db import models
from django.contrib.auth.models import User

def form_file_upload_path(instance, filename):
    # Store files in 'form_files/<form_id>/<response_id>/<filename>'
    return f"form_files/form_{instance.form.id}/response_{instance.id}/{filename}"

class Form(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    questions = models.JSONField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

class FormResponse(models.Model):
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='responses')
    respondent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    response_data = models.JSONField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    # New: store uploaded files; mapping: question_id -> FileField
    uploaded_files = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Response to {self.form.title} by {self.respondent}"