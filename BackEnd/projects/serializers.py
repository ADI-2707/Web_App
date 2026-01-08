from rest_framework import serializers
from .models import Project, ProjectMember


class ProjectListSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "public_code",
            "created_at",
            "role",
            "is_owner",
        ]

    def get_role(self, obj):
        user = self.context["request"].user
        try:
            member = ProjectMember.objects.get(project=obj, user=user)
            return member.role
        except ProjectMember.DoesNotExist:
            return None

    def get_is_owner(self, obj):
        user = self.context["request"].user
        return obj.root_admin_id == user.id
