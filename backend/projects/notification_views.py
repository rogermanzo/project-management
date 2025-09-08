from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Notification
from .serializers import NotificationSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class NotificationListView(generics.ListAPIView):
    """
    Vista para listar notificaciones del usuario
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_notifications_count(request):
    """
    Vista para obtener el conteo de notificaciones no leídas
    """
    count = Notification.objects.filter(
        user=request.user,
        is_read=False
    ).count()
    
    return Response({'count': count})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_notification_as_read(request, notification_id):
    """
    Vista para marcar una notificación como leída
    """
    try:
        notification = Notification.objects.get(
            id=notification_id,
            user=request.user
        )
        notification.mark_as_read()
        return Response({'message': 'Notificación marcada como leída'})
    except Notification.DoesNotExist:
        return Response(
            {'error': 'Notificación no encontrada'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_as_read(request):
    """
    Vista para marcar todas las notificaciones como leídas
    """
    Notification.objects.filter(
        user=request.user,
        is_read=False
    ).update(is_read=True)
    
    return Response({'message': 'Todas las notificaciones marcadas como leídas'})


def send_notification(user, notification_type, title, message, project=None, task=None):
    """
    Función helper para enviar notificaciones
    """
    print(f"🔔 Creating notification for user {user.id}: {title}")
    
    # Crear la notificación en la base de datos
    notification = Notification.objects.create(
        user=user,
        type=notification_type,
        title=title,
        message=message,
        project=project,
        task=task
    )
    
    print(f"✅ Notification created with ID: {notification.id}")
    
    # Enviar notificación en tiempo real via WebSocket
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f'notifications_{user.id}'
            message_data = {
                'type': 'notification_message',
                'notification': {
                    'id': notification.id,
                    'type': notification.type,
                    'title': notification.title,
                    'message': notification.message,
                    'is_read': notification.is_read,
                    'created_at': notification.created_at.isoformat(),
                    'project': {
                        'id': project.id,
                        'name': project.name
                    } if project else None,
                    'task': {
                        'id': task.id,
                        'title': task.title
                    } if task else None,
                }
            }
            
            print(f"📡 Sending WebSocket message to group: {group_name}")
            print(f"📨 Message data: {message_data}")
            
            async_to_sync(channel_layer.group_send)(group_name, message_data)
            print(f"✅ WebSocket message sent successfully")
        else:
            print("❌ No channel layer available")
    except Exception as e:
        print(f"⚠️ WebSocket notification failed (continuing anyway): {str(e)}")
        # No lanzar la excepción, solo logear el error
    
    return notification


