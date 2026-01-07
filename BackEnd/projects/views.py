from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import status

from .models import Project, ProjectMember
from .serializers import ProjectListSerializer
from .utils import generate_project_pin


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_projects(request):
    """
    HOME PAGE:
    Only projects where the logged-in user is ROOT ADMIN
    """
    projects = Project.objects.filter(root_admin=request.user).order_by("-created_at")

    serializer = ProjectListSerializer(projects, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_project(request):
    user = request.user
    data = request.data
    members = data.get("members", [])

    if not data.get("name"):
        return Response(
            {"error": "Project name is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(members) > 3:
        return Response(
            {"error": "Maximum 3 members allowed"},
            status=status.HTTP_400_BAD_REQUEST
        )

    admin_count = sum(1 for m in members if m.get("role") == "admin")
    if admin_count < 1:
        return Response(
            {"error": "At least one admin required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Generate secure PIN
    raw_pin = generate_project_pin()

    with transaction.atomic():
        project = Project.objects.create(
            name=data["name"],
            root_admin=user,
            pin_hash="temp",
        )
        
        project.set_pin(raw_pin)
        project.save()

        # Root admin as member
        ProjectMember.objects.create(
            project=project,
            user=user,
            role="admin"
        )

        for m in members:
            try:
                member_user = User.objects.get(email=m["email"])
            except User.DoesNotExist:
                continue  # or raise error if you want strict behavior

            ProjectMember.objects.create(
                project=project,
                user=member_user,
                role=m["role"]
            )

    return Response(
        {
            "project": {
                "id": project.id,
                "name": project.name
            },
            "pin": raw_pin  # ⚠️ returned ONCE ONLY
        },
        status=status.HTTP_201_CREATED
    )
