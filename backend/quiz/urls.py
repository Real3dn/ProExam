from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuizSessionViewSet

router = DefaultRouter()
router.register(r'', QuizSessionViewSet, basename='quiz')

urlpatterns = [
    path('', include(router.urls)),
]
