from django.db import models
from django.conf import settings

class Chat(models.Model):
    '''채팅 목록'''
    chat_id = models.AutoField(primary_key=True, db_column='chat_id', verbose_name='채팅 식별 번호')
    chat_title = models.CharField(max_length=50, verbose_name = '채팅 제목')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='수정일시')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='user_id',
        verbose_name='사용자 식별 번호'
    )

    class Meta:
        db_table = 'chat'
        verbose_name = '채팅목록'
        verbose_name_plural = '채팅목록'

    def __str__(self):
        return self.chat_title
    
class ChatLog(models.Model):
    '''상세 채팅'''

    ROLE_CHOICES = [
        ('user', '사용자'),
        ('system', '시스템')
    ]

    message_id = models.AutoField(primary_key=True, db_column='message_id')
    chat = models.ForeignKey(
        Chat, on_delete=models.CASCADE,
        db_column='chat_id',
        verbose_name='채팅 목록'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, verbose_name='역할')
    content = models.TextField(verbose_name='내용')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='생성일시')

    class Meta:
        db_table = 'chat_log'
        verbose_name = '상세 채팅'
        verbose_name_plural = '상세 채팅'

    def __str__(self):
        return f"{self.role}: {self.content[:30]}"