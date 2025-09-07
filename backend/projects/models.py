from django.db import models
from django.utils import timezone

from accounts.models import User


class Project(models.Model):
    """
    Modelo para proyectos
    Implementa el principio de Responsabilidad Única (SRP)
    """
    
    # Opciones para estados
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completado'),
        ('cancelled', 'Cancelado'),
    ]
    
    # Opciones para prioridades
    PRIORITY_CHOICES = [
        ('low', 'Baja'),
        ('medium', 'Media'),
        ('high', 'Alta'),
        ('urgent', 'Urgente'),
    ]
    
    # Campos del modelo
    name = models.CharField(
        max_length=200,
        help_text="Nombre del proyecto"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Descripción detallada del proyecto"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Estado actual del proyecto"
    )
    
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Prioridad del proyecto"
    )
    
    start_date = models.DateField(
        help_text="Fecha de inicio del proyecto"
    )
    
    end_date = models.DateField(
        blank=True,
        null=True,
        help_text="Fecha de finalización del proyecto"
    )
    
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='owned_projects',
        help_text="Usuario propietario del proyecto"
    )
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'projects'
        verbose_name = 'Proyecto'
        verbose_name_plural = 'Proyectos'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def is_active(self):
        """Verifica si el proyecto está activo"""
        return self.status == 'active'
    
    @property
    def is_completed(self):
        """Verifica si el proyecto está completado"""
        return self.status == 'completed'
    
    @property
    def progress_percentage(self):
        """Calcula el porcentaje de progreso del proyecto"""
        total_tasks = self.tasks.count()
        if total_tasks == 0:
            return 0
        
        completed_tasks = self.tasks.filter(status='completed').count()
        return round((completed_tasks / total_tasks) * 100, 2)
    
    def can_user_edit(self, user):
        """Verifica si un usuario puede editar este proyecto"""
        return user == self.owner or user.can_edit_projects()
    
    def can_user_delete(self, user):
        """Verifica si un usuario puede eliminar este proyecto"""
        return user == self.owner or user.can_delete_projects()


class ProjectMember(models.Model):
    """
    Modelo para miembros de proyectos
    Implementa el principio de Responsabilidad Única (SRP)
    """
    
    # Opciones para roles en el proyecto
    ROLE_CHOICES = [
        ('member', 'Miembro'),
        ('lead', 'Líder'),
    ]
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='members',
        help_text="Proyecto al que pertenece el miembro"
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='project_memberships',
        help_text="Usuario miembro del proyecto"
    )
    
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='member',
        help_text="Rol del usuario en el proyecto"
    )
    
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'project_members'
        verbose_name = 'Miembro de Proyecto'
        verbose_name_plural = 'Miembros de Proyectos'
        unique_together = ['project', 'user']
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.project.name}"


class Task(models.Model):
    """
    Modelo para tareas
    Implementa el principio de Responsabilidad Única (SRP)
    """
    
    # Opciones para estados
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completado'),
        ('cancelled', 'Cancelado'),
    ]
    
    # Opciones para prioridades
    PRIORITY_CHOICES = [
        ('low', 'Baja'),
        ('medium', 'Media'),
        ('high', 'Alta'),
        ('urgent', 'Urgente'),
    ]
    
    # Campos del modelo
    title = models.CharField(
        max_length=200,
        help_text="Título de la tarea"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Descripción detallada de la tarea"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Estado actual de la tarea"
    )
    
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Prioridad de la tarea"
    )
    
    due_date = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Fecha límite para completar la tarea"
    )
    
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Fecha y hora de completado de la tarea"
    )
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks',
        help_text="Proyecto al que pertenece la tarea"
    )
    
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='assigned_tasks',
        help_text="Usuario asignado a la tarea"
    )
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_tasks',
        help_text="Usuario que creó la tarea"
    )
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tasks'
        verbose_name = 'Tarea'
        verbose_name_plural = 'Tareas'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.project.name}"
    
    @property
    def is_overdue(self):
        """Verifica si la tarea está vencida"""
        if not self.due_date or self.status == 'completed':
            return False
        return timezone.now() > self.due_date
    
    @property
    def is_completed(self):
        """Verifica si la tarea está completada"""
        return self.status == 'completed'
    
    def can_user_edit(self, user):
        """Verifica si un usuario puede editar esta tarea"""
        # Administradores, colaboradores y el usuario asignado pueden editar tareas
        return user.can_edit_projects() or user == self.assigned_to
    
    def can_user_delete(self, user):
        """Verifica si un usuario puede eliminar esta tarea"""
        # Solo administradores y colaboradores pueden eliminar tareas
        return user.can_edit_projects()
    
    def save(self, *args, **kwargs):
        """Override save para marcar fecha de completado"""
        if self.status == 'completed' and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != 'completed' and self.completed_at:
            self.completed_at = None
        super().save(*args, **kwargs)


class TaskComment(models.Model):
    """
    Modelo para comentarios en tareas
    Implementa el principio de Responsabilidad Única (SRP)
    """
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments',
        help_text="Tarea a la que pertenece el comentario"
    )
    
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='task_comments',
        help_text="Usuario que escribió el comentario"
    )
    
    content = models.TextField(
        help_text="Contenido del comentario"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'task_comments'
        verbose_name = 'Comentario de Tarea'
        verbose_name_plural = 'Comentarios de Tareas'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Comentario de {self.author.get_full_name()} en {self.task.title}"
    
    def can_user_edit(self, user):
        """Verifica si un usuario puede editar este comentario"""
        return user == self.author
    
    def can_user_delete(self, user):
        """Verifica si un usuario puede eliminar este comentario"""
        return user == self.author


class Notification(models.Model):
    """
    Modelo para notificaciones del sistema
    """
    
    # Tipos de notificaciones
    TYPE_CHOICES = [
        ('task_assigned', 'Tarea Asignada'),
        ('task_completed', 'Tarea Completada'),
        ('project_assigned', 'Proyecto Asignado'),
        ('comment_added', 'Comentario Agregado'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text="Usuario que recibe la notificación"
    )
    
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        help_text="Tipo de notificación"
    )
    
    title = models.CharField(
        max_length=200,
        help_text="Título de la notificación"
    )
    
    message = models.TextField(
        help_text="Mensaje de la notificación"
    )
    
    is_read = models.BooleanField(
        default=False,
        help_text="Indica si la notificación ha sido leída"
    )
    
    # Referencias opcionales a objetos relacionados
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Proyecto relacionado (opcional)"
    )
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="Tarea relacionada (opcional)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.get_full_name()}"
    
    def mark_as_read(self):
        """Marca la notificación como leída"""
        self.is_read = True
        self.save(update_fields=['is_read'])