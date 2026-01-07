from rest_framework import serializers
from .models import Project


class ProjectListSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ["id", "name", "created_at", "role"]

    def get_role(self, obj):
        # Root admin always sees ADMIN on home
        return "admin"
