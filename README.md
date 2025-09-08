# Sistema de Gestión de Proyectos

Sistema web full-stack para gestión de proyectos, tareas y equipos de trabajo con notificaciones en tiempo real.

## Características

- **Autenticación**: Registro y login de usuarios con JWT
- **Gestión de Proyectos**: Crear, editar y administrar proyectos
- **Gestión de Tareas**: Asignar tareas, cambiar estados y agregar comentarios
- **Notificaciones**: Sistema de notificaciones en tiempo real con WebSockets
- **Dashboard**: Vista general de proyectos y tareas asignadas
- **Interfaz Responsiva**: Diseño moderno con Material-UI

## Tecnologías

- **Frontend**: React + TypeScript + Material-UI
- **Backend**: Django + Django REST Framework + Channels (WebSockets)
- **Base de Datos**: PostgreSQL
- **Cache/WebSockets**: Redis
- **Deploy**: Render (Backend + Frontend)

## URLs de Deploy

- **Frontend**: [https://gestion-proyecto-frontend.onrender.com](https://gestion-proyecto-frontend.onrender.com)
- **Backend**: [https://gestion-proyecto-backend.onrender.com](https://gestion-proyecto-backend.onrender.com)

## Instalación Local

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate

# Para WebSocket (ASGI) - RECOMENDADO
python start_websocket_server.py
# O usar el script de Windows:
# start_websocket.bat

# Alternativa: Servidor tradicional (sin WebSocket)
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## WebSocket y Notificaciones

El sistema incluye notificaciones en tiempo real usando WebSocket:

- **Endpoint WebSocket**: `ws://localhost:8000/ws/notifications/?token={token}`
- **Notificaciones automáticas**: Al asignar tareas, completar tareas, etc.
- **Conexión automática**: Se conecta automáticamente al iniciar sesión
- **Indicador de estado**: Badge verde cuando está conectado, naranja cuando está offline

**⚠️ Importante**: Para que funcionen las notificaciones en tiempo real, el backend debe ejecutarse con ASGI. Django automáticamente usa ASGI cuando detecta `daphne` instalado.

## API Endpoints

### Autenticación
- `POST /api/auth/register/` - Registro de usuarios
- `POST /api/auth/login/` - Login
- `POST /api/auth/refresh/` - Renovar token

### Proyectos
- `GET /api/projects/` - Lista de proyectos
- `POST /api/projects/` - Crear proyecto
- `GET /api/projects/{id}/` - Detalle del proyecto
- `PUT /api/projects/{id}/` - Actualizar proyecto
- `DELETE /api/projects/{id}/` - Eliminar proyecto

### Tareas
- `GET /api/projects/{id}/tasks/` - Tareas del proyecto
- `POST /api/projects/{id}/tasks/` - Crear tarea
- `GET /api/projects/tasks/{id}/` - Detalle de tarea
- `PUT /api/projects/tasks/{id}/` - Actualizar tarea
- `PATCH /api/projects/tasks/{id}/status/` - Cambiar estado de tarea
- `DELETE /api/projects/tasks/{id}/` - Eliminar tarea

### Notificaciones
- `GET /api/projects/notifications/` - Lista de notificaciones
- `GET /api/projects/notifications/unread-count/` - Conteo de no leídas
- `POST /api/projects/notifications/{id}/mark-read/` - Marcar como leída
- `POST /api/projects/notifications/mark-all-read/` - Marcar todas como leídas

## Configuración de Deploy

### Render (Backend)
- Configurado con PostgreSQL y Redis
- Variables de entorno automáticas
- Health check en `/health/simple/`

### Render (Frontend)
- Configurado para SPA routing
- Redirecciones automáticas a `index.html`
- Variables de entorno para API URL

## Desarrollo

### Estructura del Proyecto
```
gestion-proyecto/
├── backend/                 # Django API
│   ├── accounts/           # Autenticación
│   ├── projects/           # Proyectos y tareas
│   └── project_management/ # Configuración
├── frontend/               # React App
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/         # Páginas principales
│   │   ├── contexts/      # Contextos (Auth, Notifications)
│   │   └── services/      # API services
│   └── public/            # Archivos estáticos
└── README.md
```

### Scripts Útiles
```bash
# Backend
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Frontend
npm run build
npm run test
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Add nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request
