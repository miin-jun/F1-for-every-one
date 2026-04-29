from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class UserManager(BaseUserManager):
    ''' User 커스텀'''

    def create_user(self, email, password=None):
        if not email:
            raise ValueError('이메일 형식이 아닙니다.')
        
        email = self.normalize_email(email)
        user = self.model(email=email, username=email)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractUser):
    '''User'''
    user_id = models.AutoField(primary_key=True, db_column='user_id')
    email = models.EmailField(unique=True, verbose_name='이메일')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = 'users'
        verbose_name = '사용자'
        verbose_name_plural = '사용자'

    def __str__(self):
        return self.email