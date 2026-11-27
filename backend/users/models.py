from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_CHOICES = [
        ("admin", "Administrator"),
        ("manager", "Project Manager"),
        ("member", "Team Member"),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="member",
    )

    def __str__(self):
        return f"{self.username} - {self.role}"