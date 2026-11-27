from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Task, Comment
from .serializers import TaskSerializer, CommentSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == "admin":
            return Task.objects.all()

        if user.role == "manager":
            return Task.objects.filter(project__manager=user)

        return Task.objects.filter(assigned_to=user)


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Comment.objects.select_related("author", "task").order_by("created_at")
        task_id = self.request.query_params.get("task")
        if task_id:
            queryset = queryset.filter(task_id=task_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)