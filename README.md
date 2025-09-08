# Sistema de Gestión de Proyectos - Prueba Técnica

Aplicación web full-stack para gestión de proyectos y tareas con notificaciones en tiempo real.

## 🚀 Demo

- **Frontend**: [https://gestion-proyecto-frontend.onrender.com](https://gestion-proyecto-frontend.onrender.com)
- **Backend**: [https://gestion-proyecto-backend.onrender.com](https://gestion-proyecto-backend.onrender.com)

## ✨ Características

- Autenticación JWT
- CRUD de proyectos y tareas
- Notificaciones en tiempo real (WebSockets)
- Dashboard con estadísticas
- Interfaz responsiva con Material-UI

## 🛠️ Stack Tecnológico

**Frontend:** React + TypeScript + Material-UI  
**Backend:** Django + DRF + Channels  
**Base de Datos:** PostgreSQL  
**Cache:** Redis  
**Deploy:** Render

## 🚀 Instalación Local

```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm start
```

## 📡 API Principal

- `POST /api/auth/login/` - Autenticación
- `GET /api/projects/` - Lista de proyectos
- `POST /api/projects/{id}/tasks/` - Crear tarea
- `GET /api/projects/notifications/` - Notificaciones

## 🔧 Características Técnicas

- **WebSockets**: Notificaciones en tiempo real
- **JWT**: Autenticación stateless
- **PostgreSQL**: Base de datos relacional
- **Redis**: Cache y WebSockets
- **Material-UI**: Componentes modernos