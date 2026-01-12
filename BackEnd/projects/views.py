from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import Q, Value, BooleanField
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_datetime
import secrets

from .models import Project, ProjectMember
from .serializers import ProjectListSerializer
from .utils import generate_project_pin

DEFAULT_LIMIT = 10

def cursor_paginate(queryset, cursor, limit):
    """
    Standard cursor pagination for descending order (-created_at).
    We want items where created_at is LESS THAN the cursor.
    """
    if cursor:
        queryset = queryset.filter(created_at__lt=cursor)

    # Fetch limit + 1 to determine if there's a next page
    items = list(queryset[: limit + 1])
    has_more = len(items) > limit
    return items[:limit], has_more


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def owned_projects(request):
    # Parse the cursor from query params
    cursor_str = request.query_params.get("cursor")
    cursor = parse_datetime(cursor_str) if cursor_str else None
    limit = int(request.query_params.get("limit", DEFAULT_LIMIT))

    # Ensure we order by newest first
    qs = (
        Project.objects
        .filter(root_admin=request.user)
        .annotate(
            role=Value("root_admin"),
            is_owner=Value(True, output_field=BooleanField()),
        )
        .order_by("-created_at")
    )

    projects, has_more = cursor_paginate(qs, cursor, limit)
    serializer = ProjectListSerializer(projects, many=True)
    
    # The next_cursor is the timestamp of the LAST item in the current page
    next_cursor = projects[-1].created_at if projects and has_more else None
    return Response({
        "results": serializer.data,
        "has_more": has_more,
        "next_cursor": next_cursor
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def joined_projects(request):
    cursor_str = request.query_params.get("cursor")
    cursor = parse_datetime(cursor_str) if cursor_str else None
    limit = int(request.query_params.get("limit", DEFAULT_LIMIT))

    memberships_qs = (
        ProjectMember.objects
        .filter(
            user=request.user,
            role__in=["admin", "user"]
        )
        .select_related("project")
        .order_by("-joined_at")
    )

    # FIX: Use the same logic as owned_projects for consistency
    if cursor:
        memberships_qs = memberships_qs.filter(joined_at__lt=cursor)

    memberships = list(memberships_qs[: limit + 1])
    has_more = len(memberships) > limit
    current_page_members = memberships[:limit]

    projects = []
    for m in current_page_members:
        p = m.project
        p.role = m.role
        p.is_owner = (p.root_admin == request.user)
        projects.append(p)

    serializer = ProjectListSerializer(projects, many=True)

    # FIX: Use the last item's joined_at for the next cursor
    next_cursor = current_page_members[-1].joined_at if current_page_members and has_more else None

    return Response({
        "results": serializer.data,
        "has_more": has_more,
        "next_cursor": next_cursor
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def project_overview(request, project_id):
    project = get_object_or_404(Project, id=project_id)

    if project.root_admin == request.user:
        role = "root_admin"
        is_owner = True
    else:
        membership = ProjectMember.objects.filter(
            project=project,
            user=request.user
        ).first()

        if not membership:
            return Response(
                {"detail": "Access denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        role = membership.role
        is_owner = False

    return Response({
        "id": str(project.id),
        "name": project.name,
        "public_code": project.public_code,
        "created_at": project.created_at,
        "role": role,
        "is_owner": is_owner,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_project(request):
    name = request.data.get("name", "").strip()
    if not name:
        return Response({"error": "Project name is required"}, status=400)

    with transaction.atomic():
        project = Project(name=name, root_admin=request.user)

        raw_access_key = secrets.token_urlsafe(16)
        raw_pin = generate_project_pin()

        project.set_access_key(raw_access_key)
        project.set_pin(raw_pin)
        project.save()

    return Response({
        "id": str(project.id),
        "name": project.name,
        "public_code": project.public_code,
        "pin": raw_pin,
    }, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_projects(request):
    q = request.query_params.get("q", "").strip()

    if not q:
        return Response({"results": []})

    # Projects where user is owner or member
    owned_qs = Project.objects.filter(
        root_admin=request.user
    )

    joined_qs = Project.objects.filter(
        projectmember__user=request.user
    )

    qs = (
        owned_qs | joined_qs
    ).filter(
        Q(name__icontains=q) |
        Q(public_code__icontains=q)
    ).distinct().order_by("-created_at")[:10]

    results = []
    for project in qs:
        if project.root_admin == request.user:
            role = "root_admin"
            is_owner = True
        else:
            membership = ProjectMember.objects.filter(
                project=project,
                user=request.user
            ).first()
            role = membership.role if membership else "user"
            is_owner = False

        results.append({
            "id": str(project.id),
            "name": project.name,
            "public_code": project.public_code,
            "role": role,
            "is_owner": is_owner,
        })

    return Response({"results": results})