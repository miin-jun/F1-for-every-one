from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None):
        if not email:
            raise ValueError("이메일은 필수입니다.")
        email = self.normalize_email(email)
        user = self.model(email=email)
        user.set_password(password)
        user.save(using=self._db)
        return user




class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, verbose_name="이메일")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="가입일")

    USERNAME_FIELD = "email"
    def create_superuser(self, email, password=None):
        user = self.create_user(email, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:

        verbose_name = "사용자"
        verbose_name_plural = "사용자 목록"

    def __str__(self):
        return self.email
