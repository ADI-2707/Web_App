from rest_framework import serializers
from .models import ProjectMember


class ProjectListSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="project.id")
    name = serializers.CharField(source="project.name")
    created_at = serializers.DateTimeField(source="project.created_at")
    role = serializers.CharField()

    class Meta:
        model = ProjectMember
        fields = ["id", "name", "role", "created_at"]