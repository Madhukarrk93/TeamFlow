from rest_framework import serializers
from .models import Task, Comment


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = "__all__"


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source="author.username")

    class Meta:
        model = Comment
        fields = ["id", "task", "author", "author_name", "text", "created_at"]
        read_only_fields = ["id", "author", "author_name", "created_at"]