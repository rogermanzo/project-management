from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import login
from .models import User
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vista personalizada para obtener tokens JWT
    Implementa el principio de Responsabilidad Única (SRP)
    """
    
    def post(self, request, *args, **kwargs):
        serializer = UserLoginSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserProfileSerializer(user).data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    """
    Vista para registro de usuarios
    Implementa el principio de Responsabilidad Única (SRP)
    """
    print(f"Datos recibidos: {request.data}")
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserProfileSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    print(f"Errores del serializer: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Vista para obtener y actualizar perfil de usuario
    Implementa el principio de Responsabilidad Única (SRP)
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserUpdateView(generics.UpdateAPIView):
    """
    Vista para actualizar información del usuario
    Implementa el principio de Responsabilidad Única (SRP)
    """
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            self.perform_update(serializer)
            return Response({
                'message': 'Perfil actualizado exitosamente',
                'user': UserProfileSerializer(instance).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """
    Vista para cambio de contraseña
    Implementa el principio de Responsabilidad Única (SRP)
    """
    serializer = ChangePasswordSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Contraseña actualizada exitosamente'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_user(request):
    """
    Vista para logout de usuarios
    Implementa el principio de Responsabilidad Única (SRP)
    """
    try:
        # En un sistema real, aquí podrías:
        # 1. Invalidar el token en una blacklist
        # 2. Registrar el logout en logs
        # 3. Limpiar sesiones activas
        
        # Por ahora, solo retornamos éxito
        return Response({
            'message': 'Logout exitoso'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': 'Error al cerrar sesión'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_dashboard(request):
    """
    Vista para dashboard del usuario
    Implementa el principio de Responsabilidad Única (SRP)
    """
    user = request.user
    
    # Estadísticas del usuario
    stats = {
        'owned_projects': user.owned_projects.count(),
        'assigned_tasks': user.assigned_tasks.count(),
        'completed_tasks': user.assigned_tasks.filter(status='completed').count(),
        'pending_tasks': user.assigned_tasks.exclude(status='completed').count(),
    }
    
    # Proyectos recientes
    recent_projects = user.owned_projects.order_by('-created_at')[:5]
    
    # Tareas pendientes
    pending_tasks = user.assigned_tasks.exclude(
        status__in=['completed', 'cancelled']
    ).order_by('-created_at')[:10]
    
    return Response({
        'user': UserProfileSerializer(user).data,
        'stats': stats,
        'recent_projects': [
            {
                'id': project.id,
                'name': project.name,
                'status': project.status,
                'progress': project.progress_percentage
            }
            for project in recent_projects
        ],
        'pending_tasks': [
            {
                'id': task.id,
                'title': task.title,
                'project_name': task.project.name,
                'status': task.status,
                'due_date': task.due_date,
                'is_overdue': task.is_overdue
            }
            for task in pending_tasks
        ]
    })


class UserListView(generics.ListAPIView):
    """
    Vista para listar usuarios (solo para administradores)
    Implementa el principio de Responsabilidad Única (SRP)
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin():
            return User.objects.all()
        elif user.is_collaborator():
            # Los colaboradores pueden ver otros colaboradores y visores
            return User.objects.filter(role__in=['collaborator', 'viewer'])
        else:
            # Los visores solo pueden ver su propio perfil
            return User.objects.filter(id=user.id)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'users': serializer.data,
            'count': queryset.count()
        })