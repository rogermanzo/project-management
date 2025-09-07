import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from accounts.models import User


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Obtener el token de la query string
        token = self.scope['query_string'].decode().split('token=')[1] if 'token=' in self.scope['query_string'].decode() else None
        
        if not token:
            await self.close()
            return
        
        # Verificar el token y obtener el usuario
        user = await self.get_user_from_token(token)
        if not user or isinstance(user, AnonymousUser):
            await self.close()
            return
        
        # Agregar el usuario al scope
        self.scope['user'] = user
        self.user = user
        
        # Unirse al grupo de notificaciones del usuario
        self.group_name = f'notifications_{user.id}'
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Salir del grupo de notificaciones
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'mark_as_read':
            notification_id = data.get('notification_id')
            await self.mark_notification_as_read(notification_id)
    
    async def notification_message(self, event):
        # Enviar notificación al WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        """Obtiene el usuario desde el token JWT"""
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id)
        except:
            return None
    
    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        """Marca una notificación como leída"""
        from .models import Notification
        try:
            notification = Notification.objects.get(id=notification_id, user=self.user)
            notification.mark_as_read()
        except Notification.DoesNotExist:
            pass
