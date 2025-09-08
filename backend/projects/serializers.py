from rest_framework import serializers
from django.utils import timezone
from accounts.models import User
from .models import Project, ProjectMember, Task, TaskComment, Notification


class ProjectMemberSerializer(serializers.ModelSerializer):
    """
    Serializer para miembros de proyecto
    Implementa el principio de Responsabilidad Única (SRP)
    """
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = ProjectMember
        fields = ['id', 'user', 'user_name', 'user_email', 'role', 'role_display', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer para proyectos
    Implementa el principio de Responsabilidad Única (SRP)
    """
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    members_count = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()
    can_user_edit = serializers.SerializerMethodField()
    can_user_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'status_display',
            'priority', 'priority_display', 'start_date', 'end_date',
            'owner', 'owner_name', 'progress_percentage', 'members_count',
            'tasks_count', 'can_user_edit', 'can_user_delete', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']
    
    def get_members_count(self, obj):
        """Retorna el número de miembros del proyecto"""
        return obj.members.count()
    
    def get_tasks_count(self, obj):
        """Retorna el número de tareas del proyecto"""
        return obj.tasks.count()
    
    def get_can_user_edit(self, obj):
        """Verifica si el usuario puede editar el proyecto"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_user_edit(request.user)
        return False
    
    def get_can_user_delete(self, obj):
        """Verifica si el usuario puede eliminar el proyecto"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_user_delete(request.user)
        return False
    
    def validate_end_date(self, value):
        """Valida que la fecha de fin sea posterior a la de inicio"""
        if value and hasattr(self, 'initial_data'):
            start_date_str = self.initial_data.get('start_date')
            if start_date_str:
                from datetime import datetime
                try:
                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                    if value <= start_date:
                        raise serializers.ValidationError(
                            "La fecha de fin debe ser posterior a la fecha de inicio."
                        )
                except ValueError:
                    # Si hay error en el formato de fecha, no validamos
                    pass
        return value
    
    def create(self, validated_data):
        """Crea un nuevo proyecto"""
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class ProjectDetailSerializer(ProjectSerializer):
    """
    Serializer detallado para proyectos
    Implementa el principio de Responsabilidad Única (SRP)
    """
    members = ProjectMemberSerializer(many=True, read_only=True)
    
    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ['members']


class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer para tareas
    Implementa el principio de Responsabilidad Única (SRP)
    """
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'status_display',
            'priority', 'priority_display', 'due_date', 'completed_at',
            'project', 'project_name', 'assigned_to', 'assigned_to_name',
            'created_by', 'created_by_name', 'is_overdue', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'completed_at', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Crear tarea asignando el creador automáticamente"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
            # Solo administradores pueden asignar usuarios
            if not request.user.is_admin() and 'assigned_to' in validated_data:
                validated_data.pop('assigned_to', None)
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Actualizar tarea con restricciones de asignación"""
        request = self.context.get('request')
        if request and request.user:
            # Solo administradores pueden cambiar la asignación
            if not request.user.is_admin() and 'assigned_to' in validated_data:
                validated_data.pop('assigned_to', None)
        return super().update(instance, validated_data)


class TaskStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para que los usuarios asignados puedan actualizar solo el estado de la tarea
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'status', 'status_display']
    
    def validate_status(self, value):
        """Validar que el estado sea válido"""
        valid_statuses = ['pending', 'in_progress', 'completed', 'cancelled']
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Estado inválido. Debe ser uno de: {', '.join(valid_statuses)}")
        return value


class TaskCommentSerializer(serializers.ModelSerializer):
    """
    Serializer para comentarios de tareas
    Implementa el principio de Responsabilidad Única (SRP)
    """
    
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    
    class Meta:
        model = TaskComment
        fields = [
            'id', 'content', 'author', 'author_name', 'author_username',
            'created_at', 'updated_at', 'can_edit', 'can_delete'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']
    
    def get_can_edit(self, obj):
        """Verifica si el usuario actual puede editar el comentario"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_user_edit(request.user)
        return False
    
    def get_can_delete(self, obj):
        """Verifica si el usuario actual puede eliminar el comentario"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_user_delete(request.user)
        return False
    
    def create(self, validated_data):
        """Crear comentario asignando el autor automáticamente"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['author'] = request.user
        return super().create(validated_data)


class TaskCommentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear comentarios de tareas
    """
    
    class Meta:
        model = TaskComment
        fields = ['content']
    
    def create(self, validated_data):
        """Crear comentario asignando el autor automáticamente"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['author'] = request.user
        return super().create(validated_data)


class TaskDetailSerializer(TaskSerializer):
    """
    Serializer detallado para tareas
    Implementa el principio de Responsabilidad Única (SRP)
    """
    project = ProjectSerializer(read_only=True)
    
    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields


class ProjectMemberCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para agregar miembros a un proyecto
    Implementa el principio de Responsabilidad Única (SRP)
    """
    user = serializers.IntegerField(write_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = ProjectMember
        fields = ['user', 'role', 'user_name']
    
    def validate_user(self, value):
        """Valida que el usuario exista"""
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "No existe un usuario con este ID."
            )
        return user
    
    def validate(self, attrs):
        """Valida que el usuario no sea ya miembro del proyecto"""
        user = attrs['user']
        project = self.context['project']
        
        if ProjectMember.objects.filter(project=project, user=user).exists():
            raise serializers.ValidationError(
                "Este usuario ya es miembro del proyecto."
            )
        
        return attrs
    
    def create(self, validated_data):
        """Crea un nuevo miembro del proyecto"""
        validated_data['project'] = self.context['project']
        return super().create(validated_data)


class ProjectStatsSerializer(serializers.Serializer):
    """
    Serializer para estadísticas de proyecto
    Implementa el principio de Responsabilidad Única (SRP)
    """
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    in_progress_tasks = serializers.IntegerField()
    pending_tasks = serializers.IntegerField()
    overdue_tasks = serializers.IntegerField()
    progress_percentage = serializers.FloatField()
    total_members = serializers.IntegerField()


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer para notificaciones
    """
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'type_display', 'title', 'message', 'is_read',
            'project', 'project_name', 'task', 'task_title', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
