from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer para registro de usuarios
    Implementa el principio de Responsabilidad Única (SRP)
    """
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        help_text="Contraseña del usuario"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        help_text="Confirmación de contraseña"
    )
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'role', 'password', 'password_confirm'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'phone': {'required': False, 'allow_blank': True},
        }
    
    def validate(self, attrs):
        """Valida que las contraseñas coincidan"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                {"password_confirm": "Las contraseñas no coinciden."}
            )
        return attrs
    
    def validate_email(self, value):
        """Valida que el email sea único"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Ya existe un usuario con este email."
            )
        return value
    
    def validate_role(self, value):
        """Valida que el rol sea válido"""
        valid_roles = ['admin', 'collaborator', 'viewer']
        if value not in valid_roles:
            raise serializers.ValidationError(
                f"Rol inválido. Debe ser uno de: {', '.join(valid_roles)}"
            )
        return value
    
    def create(self, validated_data):
        """Crea un nuevo usuario"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Log para debugging
        print(f"Creando usuario con datos: {validated_data}")
        
        # Crear usuario usando el método estándar
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'viewer'),
            phone=validated_data.get('phone', ''),
        )
        user.set_password(password)
        user.save()
        
        print(f"Usuario creado exitosamente: {user.username}, rol: {user.role}")
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer para login de usuarios
    Implementa el principio de Responsabilidad Única (SRP)
    """
    username = serializers.CharField(help_text="Username o email del usuario")
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """Valida las credenciales del usuario"""
        username_or_email = attrs.get('username')
        password = attrs.get('password')
        
        if username_or_email and password:
            # Intentar autenticación con username primero
            user = authenticate(
                request=self.context.get('request'),
                username=username_or_email,
                password=password
            )
            
            # Si no funciona con username, intentar con email
            if not user:
                try:
                    # Buscar usuario por email
                    user_obj = User.objects.get(email=username_or_email)
                    user = authenticate(
                        request=self.context.get('request'),
                        username=user_obj.username,
                        password=password
                    )
                except User.DoesNotExist:
                    user = None
            
            if not user:
                raise serializers.ValidationError(
                    'Credenciales inválidas.',
                    code='authorization'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'La cuenta de usuario está desactivada.',
                    code='authorization'
                )
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                'Debe incluir "username/email" y "password".',
                code='authorization'
            )


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer para perfil de usuario
    Implementa el principio de Responsabilidad Única (SRP)
    """
    full_name = serializers.ReadOnlyField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    can_edit_projects = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'phone', 'role', 'role_display', 'avatar',
            'is_verified', 'date_joined', 'last_login', 'can_edit_projects'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'last_login']
    
    def get_can_edit_projects(self, obj):
        """Verifica si el usuario puede editar proyectos"""
        return obj.can_edit_projects()


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualización de usuario
    Implementa el principio de Responsabilidad Única (SRP)
    """
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'avatar'
        ]
    
    def validate_phone(self, value):
        """Valida el formato del teléfono"""
        if value and not value.startswith('+'):
            # Agregar código de país por defecto si no se especifica
            value = '+52' + value
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer para cambio de contraseña
    Implementa el principio de Responsabilidad Única (SRP)
    """
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_old_password(self, value):
        """Valida la contraseña actual"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                'La contraseña actual es incorrecta.'
            )
        return value
    
    def validate(self, attrs):
        """Valida que las nuevas contraseñas coincidan"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {"new_password_confirm": "Las contraseñas no coinciden."}
            )
        return attrs
    
    def save(self):
        """Actualiza la contraseña del usuario"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
