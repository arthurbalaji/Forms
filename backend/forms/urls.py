from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FormViewSet, FormResponseViewSet, AuthView

router = DefaultRouter()
router.register(r'forms', FormViewSet, basename='form')

# Define this before urlpatterns:
form_response_download = FormResponseViewSet.as_view({
    'get': 'download_file'
})

urlpatterns = [
    path('auth/', AuthView.as_view()),
    path('forms/<int:form_pk>/responses/', FormResponseViewSet.as_view({
        'get': 'list',
        'post': 'create'
    })),
    path(
        'forms/<int:form_pk>/responses/<int:pk>/download/<str:question_id>/',
        form_response_download,
        name='formresponse-download-file'
    ),
    path('', include(router.urls)),
]