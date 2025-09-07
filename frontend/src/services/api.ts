import axios, { AxiosResponse } from 'axios';
import { AuthResponse, LoginCredentials, RegisterData, User, Project, Task } from '../types';

// Configuración base de Axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token agregado a la petición:', config.url);
    } else {
      console.warn('No hay token disponible para la petición:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    console.log('Error en petición:', error.response?.status, error.config?.url);

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Intentando refrescar token...');
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);
          console.log('Token refrescado exitosamente');
          
          // Reintentar la petición original
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } else {
          console.warn('No hay refresh token disponible');
        }
      } catch (refreshError) {
        console.error('Error al refrescar token:', refreshError);
        // Si falla el refresh, limpiar tokens y redirigir al login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/api/auth/login/', credentials);
    return response.data;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/api/auth/register/', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      // Enviar petición al backend para logout
      await api.post('/api/auth/logout/');
    } catch (error) {
      // Si falla la petición, continuar con el logout local
      console.warn('Error al notificar logout al servidor:', error);
    } finally {
      // Siempre limpiar tokens locales
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response: AxiosResponse<User> = await api.get('/api/auth/profile/');
    return response.data;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response: AxiosResponse<User> = await api.patch('/api/auth/profile/update/', userData);
    return response.data;
  },

  changePassword: async (passwords: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<void> => {
    await api.post('/api/auth/change-password/', passwords);
  },
};

// Servicios de proyectos
export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const response: AxiosResponse<{ results: Project[] }> = await api.get('/api/projects/');
    return response.data.results || response.data;
  },

  getProject: async (id: number): Promise<Project> => {
    const response: AxiosResponse<Project> = await api.get(`/api/projects/${id}/`);
    return response.data;
  },

  createProject: async (projectData: Partial<Project>): Promise<Project> => {
    const response: AxiosResponse<Project> = await api.post('/api/projects/', projectData);
    return response.data;
  },

  updateProject: async (id: number, projectData: Partial<Project>): Promise<Project> => {
    const response: AxiosResponse<Project> = await api.patch(`/api/projects/${id}/`, projectData);
    return response.data;
  },

  deleteProject: async (id: number): Promise<void> => {
    await api.delete(`/api/projects/${id}/`);
  },

  getProjectStats: async (id: number): Promise<any> => {
    const response = await api.get(`/api/projects/${id}/stats/`);
    return response.data;
  },

  // Servicios para gestión de miembros
  getProjectMembers: async (projectId: number): Promise<any[]> => {
    const response = await api.get(`/api/projects/${projectId}/members/`);
    return response.data;
  },

  addProjectMember: async (projectId: number, userId: number): Promise<any> => {
    const response = await api.post(`/api/projects/${projectId}/members/add/`, { user: userId });
    return response.data;
  },

  removeProjectMember: async (projectId: number, memberId: number): Promise<void> => {
    await api.delete(`/api/projects/${projectId}/members/${memberId}/remove/`);
  },

  removeUserFromProject: async (projectId: number, userId: number): Promise<void> => {
    await api.delete(`/api/projects/${projectId}/members/${userId}/remove-user/`);
  },
};

// Servicios de tareas
export const taskService = {
  getTasks: async (projectId?: number): Promise<Task[]> => {
    const url = projectId ? `/api/projects/${projectId}/tasks/` : '/api/projects/tasks/';
    const response: AxiosResponse<{ results: Task[] }> = await api.get(url);
    return response.data.results || response.data;
  },

  getTask: async (id: number): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.get(`/api/projects/tasks/${id}/`);
    return response.data;
  },

  createTask: async (taskData: Partial<Task>, projectId?: number): Promise<Task> => {
    const url = projectId ? `/api/projects/${projectId}/tasks/` : '/api/projects/tasks/';
    const response: AxiosResponse<Task> = await api.post(url, taskData);
    return response.data;
  },

  updateTask: async (id: number, taskData: Partial<Task>): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.patch(`/api/projects/tasks/${id}/`, taskData);
    return response.data;
  },

  updateTaskStatus: async (id: number, status: string): Promise<Task> => {
    const response: AxiosResponse<Task> = await api.patch(`/api/projects/tasks/${id}/status/`, { status });
    return response.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/api/projects/tasks/${id}/`);
  },

  getUserTasks: async (status?: string): Promise<{ tasks: Task[]; count: number; overdue_count: number }> => {
    const params = status ? { status } : {};
    const response = await api.get('/api/projects/my-tasks/', { params });
    return response.data;
  },
};

// Servicios de usuarios
export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response: AxiosResponse<{ users: User[] }> = await api.get('/api/auth/users/');
    return response.data.users;
  },
};

// Servicios de notificaciones
export const notificationService = {
  getNotifications: async (): Promise<any[]> => {
    const response = await api.get('/api/projects/notifications/');
    // Si la respuesta tiene paginación, devolver los resultados
    return response.data.results || response.data || [];
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/api/projects/notifications/unread-count/');
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    await api.post(`/api/projects/notifications/${notificationId}/mark-read/`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.post('/api/projects/notifications/mark-all-read/');
  },
};

export default api;
