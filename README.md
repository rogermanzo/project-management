# Sistema de Gestión de Proyectos

Sistema web full-stack para gestión de proyectos, tareas y equipos de trabajo.

## Características

- **Autenticación**: Registro y login de usuarios
- **Gestión de Proyectos**: Crear, editar y administrar proyectos
- **Gestión de Tareas**: Asignar tareas, cambiar estados y agregar comentarios
- **Notificaciones**: Sistema de notificaciones en tiempo real
- **Dashboard**: Vista general de proyectos y tareas asignadas

## Tecnologías

- **Frontend**: React + TypeScript + Vite
- **Backend**: Django + Django REST Framework + WebSockets
- **Base de Datos**: PostgreSQL
- **Deploy**: Render (Backend) + Vercel/Netlify (Frontend)

## URLs de Deploy

- **Frontend**: [https://gestion-proyecto-frontend.onrender.com](https://gestion-proyecto-frontend.onrender.com)
- **Backend**: [https://project-management-c7wf.onrender.com](https://project-management-c7wf.onrender.com)

## Instalación Local

### Backend
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## API Endpoints

- `POST /api/auth/register/` - Registro de usuarios
- `POST /api/auth/login/` - Login
- `GET /api/projects/` - Lista de proyectos
- `POST /api/projects/` - Crear proyecto
- `GET /api/projects/{id}/tasks/` - Tareas del proyecto
