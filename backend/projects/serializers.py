from rest_framework import serializers
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    manager_username = serializers.CharField(
        source="manager.username",
        read_only=True
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "manager",
            "manager_username",
            "start_date",
            "end_date",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "manager",
            "created_at",
            "updated_at",
        ]