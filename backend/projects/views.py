from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone
from .models import Project, ProjectMember, Task, TaskComment
from accounts.models import User
from .serializers import (
    ProjectSerializer, ProjectDetailSerializer, ProjectMemberSerializer,
    ProjectMemberCreateSerializer, TaskSerializer, TaskDetailSerializer,
    ProjectStatsSerializer, TaskCommentSerializer, TaskCommentCreateSerializer,
    TaskStatusUpdateSerializer
)


class ProjectListView(generics.ListCreateAPIView):
    """Vista para listar y crear proyectos"""
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin():
            return Project.objects.all()
        elif user.is_collaborator():
            return Project.objects.filter(
                Q(owner=user) | Q(members__user=user)
            ).distinct()
        else:
            return Project.objects.filter(members__user=user).distinct()
    
    def get_serializer_context(self):
        """Pasa el request al serializer para los permisos"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para obtener, actualizar y eliminar proyectos"""
    serializer_class = ProjectDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin():
            return Project.objects.all()
        elif user.is_collaborator():
            return Project.objects.filter(
                Q(owner=user) | Q(members__user=user)
            ).distinct()
        else:
            return Project.objects.filter(members__user=user).distinct()
    
    def get_serializer_context(self):
        """Pasa el request al serializer para los permisos"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.can_user_edit(request.user):
            return Response(
                {'error': 'No tienes permisos para editar este proyecto.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.can_user_delete(request.user):
            return Response(
                {'error': 'No tienes permisos para eliminar este proyecto.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class TaskListView(generics.ListCreateAPIView):
    """Vista para listar y crear tareas"""
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        user = self.request.user
        
        queryset = Task.objects.all()
        
        if project_id:
            try:
                project = Project.objects.get(id=project_id)
                # Solo super admin o usuarios que son miembros del proyecto Y tienen tareas asignadas
                if user.is_superuser or user.is_admin():
                    queryset = queryset.filter(project=project)
                elif project.members.filter(user=user).exists():
                    queryset = queryset.filter(
                        project=project,
                        assigned_to=user
                    )
                else:
                    return Task.objects.none()
            except Project.DoesNotExist:
                return Task.objects.none()
        else:
            if user.is_superuser or user.is_admin():
                pass  # Super admin ve todas las tareas
            else:
                # Usuarios solo ven tareas asignadas a ellos Y donde son miembros del proyecto
                queryset = queryset.filter(
                    Q(assigned_to=user) & Q(project__members__user=user)
                ).distinct()
        
        return queryset
    
    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_id')
        if project_id:
            try:
                project = Project.objects.get(id=project_id)
                if not project.can_user_edit(self.request.user):
                    raise PermissionError('No tienes permisos para crear tareas en este proyecto.')
                task = serializer.save(project=project)
                
                # Enviar notificación al usuario asignado
                from .notification_views import send_notification
                send_notification(
                    user=task.assigned_to,
                    notification_type='task_assigned',
                    title='Nueva tarea asignada',
                    message=f'Se te ha asignado la tarea "{task.title}" en el proyecto "{project.name}"',
                    project=project,
                    task=task
                )
            except Project.DoesNotExist:
                raise ValueError('Proyecto no encontrado.')
        else:
            task = serializer.save()
            
            # Enviar notificación al usuario asignado
            from .notification_views import send_notification
            send_notification(
                user=task.assigned_to,
                notification_type='task_assigned',
                title='Nueva tarea asignada',
                message=f'Se te ha asignado la tarea "{task.title}"',
                project=task.project,
                task=task
            )


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para obtener, actualizar y eliminar tareas"""
    serializer_class = TaskDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin():
            return Task.objects.all()
        elif user.is_collaborator():
            return Task.objects.filter(
                Q(project__owner=user) | Q(project__members__user=user)
            ).distinct()
        else:
            return Task.objects.filter(project__members__user=user).distinct()
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.can_user_edit(request.user):
            return Response(
                {'error': 'No tienes permisos para editar esta tarea.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Guardar el assigned_to anterior para comparar
        old_assigned_to = instance.assigned_to
        
        # Realizar la actualización
        response = super().update(request, *args, **kwargs)
        
        # Verificar si se asignó la tarea a un nuevo usuario
        if response.status_code == 200:
            updated_task = self.get_object()
            if (old_assigned_to != updated_task.assigned_to and 
                updated_task.assigned_to is not None):
                # Enviar notificación al nuevo usuario asignado
                from .notification_views import send_notification
                send_notification(
                    user=updated_task.assigned_to,
                    notification_type='task_assigned',
                    title='Tarea asignada',
                    message=f'Se te ha asignado la tarea: {updated_task.title}',
                    project=updated_task.project,
                    task=updated_task
                )
        
        return response
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.can_user_delete(request.user):
            return Response(
                {'error': 'No tienes permisos para eliminar esta tarea.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_stats(request, project_id):
    """Vista para estadísticas de proyecto"""
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response(
            {'error': 'Proyecto no encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    user = request.user
    if not (project.owner == user or 
            project.members.filter(user=user).exists() or 
            user.is_admin()):
        return Response(
            {'error': 'No tienes permisos para ver este proyecto.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    tasks = project.tasks.all()
    total_tasks = tasks.count()
    completed_tasks = tasks.filter(status='completed').count()
    in_progress_tasks = tasks.filter(status='in_progress').count()
    pending_tasks = tasks.exclude(status__in=['completed', 'cancelled']).count()
    overdue_tasks = tasks.filter(
        due_date__lt=timezone.now(),
        status__in=['todo', 'in_progress', 'review']
    ).count()
    
    progress_percentage = round((completed_tasks / total_tasks * 100), 2) if total_tasks > 0 else 0
    
    stats = {
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'in_progress_tasks': in_progress_tasks,
        'pending_tasks': pending_tasks,
        'overdue_tasks': overdue_tasks,
        'progress_percentage': progress_percentage,
        'total_members': project.members.count(),
        'active_members': project.members.filter(user__is_active=True).count()
    }
    
    serializer = ProjectStatsSerializer(stats)
    return Response({
        'project': ProjectSerializer(project).data,
        'stats': serializer.data
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_project_member(request, project_id):
    """
    Vista para agregar miembros a un proyecto
    Solo administradores pueden asignar usuarios a proyectos
    """
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response(
            {'error': 'Proyecto no encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Solo administradores pueden asignar usuarios
    if not request.user.is_admin():
        return Response(
            {'error': 'Solo los administradores pueden asignar usuarios a proyectos.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = ProjectMemberCreateSerializer(data=request.data, context={'project': project})
    if serializer.is_valid():
        # Solo colaboradores y visores pueden ser asignados
        user = serializer.validated_data['user']
        if user.role not in ['collaborator', 'viewer']:
            return Response(
                {'error': 'Solo colaboradores y visores pueden ser asignados a proyectos.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        member = serializer.save()
        
        # Enviar notificación al usuario asignado
        from .notification_views import send_notification
        send_notification(
            user=user,
            notification_type='project_assigned',
            title='Has sido asignado a un proyecto',
            message=f'Has sido asignado al proyecto "{project.name}"',
            project=project
        )
        
        response_serializer = ProjectMemberSerializer(member)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_project_member(request, project_id, member_id):
    """
    Vista para remover miembros de un proyecto
    Solo administradores pueden remover usuarios de proyectos
    """
    try:
        project = Project.objects.get(id=project_id)
        member = ProjectMember.objects.get(id=member_id, project=project)
    except (Project.DoesNotExist, ProjectMember.DoesNotExist):
        return Response(
            {'error': 'Proyecto o miembro no encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Solo administradores pueden remover usuarios
    if not request.user.is_admin():
        return Response(
            {'error': 'Solo los administradores pueden remover usuarios de proyectos.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    member.delete()
    return Response(
        {'message': 'Miembro removido del proyecto exitosamente.'},
        status=status.HTTP_200_OK
    )


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_user_from_project(request, project_id, user_id):
    """
    Vista para que un admin o colaborador quite a un usuario específico de un proyecto
    """
    try:
        project = Project.objects.get(id=project_id)
        target_user = User.objects.get(id=user_id)
        member = ProjectMember.objects.get(project=project, user=target_user)
    except (Project.DoesNotExist, User.DoesNotExist, ProjectMember.DoesNotExist):
        return Response(
            {'error': 'Proyecto, usuario o membresía no encontrada.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Solo administradores pueden quitar usuarios
    if not request.user.is_admin():
        return Response(
            {'error': 'Solo los administradores pueden quitar usuarios de proyectos.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # No se puede quitar el propietario del proyecto
    if project.owner == target_user:
        return Response(
            {'error': 'No se puede quitar al propietario del proyecto.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Un usuario no puede quitarse a sí mismo (debe ser removido por otro)
    if request.user == target_user:
        return Response(
            {'error': 'No puedes quitarte a ti mismo del proyecto. Solicita a otro administrador o colaborador que te remueva.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    member.delete()
    return Response(
        {'message': f'Usuario {target_user.full_name} removido del proyecto exitosamente.'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_members(request, project_id):
    """
    Vista para listar miembros de un proyecto
    """
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response(
            {'error': 'Proyecto no encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar permisos para ver el proyecto
    if not (project.owner == request.user or 
            project.members.filter(user=request.user).exists() or 
            request.user.is_admin()):
        return Response(
            {'error': 'No tienes permisos para ver este proyecto.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    members = ProjectMember.objects.filter(project=project)
    print(f"Miembros encontrados para proyecto {project_id}: {members.count()}")
    for member in members:
        print(f"  - Usuario: {member.user.id} ({member.user.full_name}), Rol: {member.role}")
    serializer = ProjectMemberSerializer(members, many=True)
    print(f"Datos serializados: {serializer.data}")
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def task_comments(request, task_id):
    """
    Vista para listar comentarios de una tarea
    """
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response(
            {'error': 'Tarea no encontrada.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar permisos para ver la tarea
    if not (task.assigned_to == request.user or 
            task.created_by == request.user or 
            task.project.owner == request.user or 
            task.project.members.filter(user=request.user).exists() or 
            request.user.is_admin()):
        return Response(
            {'error': 'No tienes permisos para ver esta tarea.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    comments = TaskComment.objects.filter(task=task)
    serializer = TaskCommentSerializer(comments, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_task_comment(request, task_id):
    """
    Vista para crear comentarios en una tarea
    Solo usuarios asignados a la tarea pueden comentar
    """
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response(
            {'error': 'Tarea no encontrada.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Solo usuarios asignados a la tarea pueden comentar
    if not (task.assigned_to == request.user or 
            task.created_by == request.user or 
            task.project.owner == request.user or 
            task.project.members.filter(user=request.user).exists() or 
            request.user.is_admin()):
        return Response(
            {'error': 'Solo los usuarios asignados a la tarea pueden agregar comentarios.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = TaskCommentCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        comment = serializer.save(task=task)
        response_serializer = TaskCommentSerializer(comment, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_task_comment(request, comment_id):
    """
    Vista para actualizar comentarios de tareas
    Solo el autor puede editar su comentario
    """
    try:
        comment = TaskComment.objects.get(id=comment_id)
    except TaskComment.DoesNotExist:
        return Response(
            {'error': 'Comentario no encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Solo el autor puede editar su comentario
    if not comment.can_user_edit(request.user):
        return Response(
            {'error': 'Solo puedes editar tus propios comentarios.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = TaskCommentCreateSerializer(comment, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        comment = serializer.save()
        response_serializer = TaskCommentSerializer(comment, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_task_comment(request, comment_id):
    """
    Vista para eliminar comentarios de tareas
    El autor, propietario del proyecto o admin pueden eliminar
    """
    try:
        comment = TaskComment.objects.get(id=comment_id)
    except TaskComment.DoesNotExist:
        return Response(
            {'error': 'Comentario no encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verificar permisos para eliminar
    if not comment.can_user_delete(request.user):
        return Response(
            {'error': 'No tienes permisos para eliminar este comentario.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    comment.delete()
    return Response(
        {'message': 'Comentario eliminado exitosamente.'},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_tasks(request):
    """Vista para tareas del usuario (solo super admin ve todas, otros solo las asignadas)"""
    user = request.user
    status_filter = request.query_params.get('status')
    
    print(f"Usuario: {user.username}, Rol: {user.role}, Superuser: {user.is_superuser}, Filtro: {status_filter}")
    
    # Solo super administradores ven todas las tareas
    if user.is_superuser or user.is_admin():
        queryset = Task.objects.all()
        print(f"Super Admin - Total tareas antes del filtro: {queryset.count()}")
    else:
        # Usuarios solo ven tareas asignadas a ellos Y donde son miembros del proyecto
        from django.db.models import Q
        
        queryset = Task.objects.filter(
            Q(assigned_to=user) & Q(project__members__user=user)
        ).distinct()
        print(f"Usuario - Total tareas (asignadas Y miembro del proyecto): {queryset.count()}")
    
    if status_filter:
        queryset = queryset.filter(status=status_filter)
        print(f"Después del filtro '{status_filter}': {queryset.count()}")
    
    queryset = queryset.order_by('due_date', '-created_at')
    
    serializer = TaskSerializer(queryset, many=True)
    
    return Response({
        'tasks': serializer.data,
        'count': queryset.count(),
        'overdue_count': queryset.filter(
            due_date__lt=timezone.now(),
            status__in=['pending', 'in_progress']
        ).count()
    })


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_task_status(request, task_id):
    """
    Permite a los usuarios asignados actualizar el estado de sus tareas
    """
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({'error': 'Tarea no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Verificar permisos: admin, colaborador o usuario asignado
    if not task.can_user_edit(request.user):
        return Response({
            'error': 'No tienes permisos para actualizar esta tarea.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = TaskStatusUpdateSerializer(task, data=request.data, partial=True)
    if serializer.is_valid():
        old_status = task.status
        updated_task = serializer.save()
        
        # Enviar notificación si la tarea se completó
        if old_status != 'completed' and updated_task.status == 'completed':
            from .notification_views import send_notification
            send_notification(
                user=updated_task.assigned_to,
                notification_type='task_completed',
                title='Tarea completada',
                message=f'Has completado la tarea "{updated_task.title}"',
                project=updated_task.project,
                task=updated_task
            )
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)