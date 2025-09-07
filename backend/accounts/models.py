from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.validators import RegexValidator


class UserManager(BaseUserManager):
    """Manager personalizado para el modelo User"""
    
    def create_user(self, username, email, password=None, **extra_fields):
        """Crea y retorna un usuario regular"""
        if not email:
            raise ValueError('El email es obligatorio')
        
        email = self.normalize_email(email)
        user = self.model(
            username=username,
            email=email,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email, password=None, **extra_fields):
        """Crea y retorna un superusuario"""
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractUser):
    """
    Modelo de usuario personalizado que extiende AbstractUser
    Implementa el principio de Responsabilidad Única (SRP)
    """
    
    objects = UserManager()
    
    # Opciones para roles
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('collaborator', 'Colaborador'),
        ('viewer', 'Visor'),
    ]
    
    # Validadores
    phone_validator = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="El número de teléfono debe tener entre 9 y 15 dígitos."
    )
    
    # Campos adicionales
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='viewer',
        help_text="Rol del usuario en el sistema"
    )
    
    phone = models.CharField(
        max_length=17,
        blank=True,
        null=True,
        help_text="Número de teléfono del usuario"
    )
    
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        help_text="Foto de perfil del usuario"
    )
    
    is_verified = models.BooleanField(
        default=False,
        help_text="Indica si el usuario ha verificado su email"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    @property
    def full_name(self):
        """Retorna el nombre completo del usuario"""
        return f"{self.first_name} {self.last_name}".strip()
    
    def is_admin(self):
        """Verifica si el usuario es administrador"""
        return self.role == 'admin'
    
    def is_collaborator(self):
        """Verifica si el usuario es colaborador"""
        return self.role == 'collaborator'
    
    def is_viewer(self):
        """Verifica si el usuario es visor"""
        return self.role == 'viewer'
    
    def can_edit_projects(self):
        """Verifica si el usuario puede editar proyectos"""
        return self.role in ['admin', 'collaborator']
    
    def can_delete_projects(self):
        """Verifica si el usuario puede eliminar proyectos"""
        return self.role == 'admin'