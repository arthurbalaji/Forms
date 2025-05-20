from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FormViewSet, FormResponseViewSet, AuthView

router = DefaultRouter()
router.register(r'forms', FormViewSet, basename='form')

urlpatterns = [
    path('auth/', AuthView.as_view()),
    path('forms/<int:form_pk>/responses/', FormResponseViewSet.as_view({
        'get': 'list',
        'post': 'create'
    })),
    path('', include(router.urls)),
]