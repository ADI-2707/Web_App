import uuid
from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    root_admin = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="root_admin_projects"
    )
    
    pin_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_pin(self, raw_pin: str):
        """Hash and store the project PIN"""
        self.pin_hash = make_password(raw_pin)

    def check_pin(self, raw_pin: str) -> bool:
        """Verify entered PIN against stored hash"""
        return check_password(raw_pin, self.pin_hash)

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("user", "User"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    class Meta:
        unique_together = ("user", "project")

    def __str__(self):
        return f"{self.user.email} - {self.project.name}"
