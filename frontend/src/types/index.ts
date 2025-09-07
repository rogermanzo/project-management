// Tipos para la aplicación
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'collaborator' | 'viewer';
  role_display: string;
  avatar?: string;
  is_verified: boolean;
  date_joined: string;
  last_login?: string;
  can_edit_projects?: boolean;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  status_display: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  priority_display: string;
  start_date: string;
  end_date?: string;
  owner: number;
  owner_name: string;
  progress_percentage: number;
  members_count: number;
  tasks_count: number;
  created_at: string;
  updated_at: string;
  can_user_edit?: boolean;
  can_user_delete?: boolean;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  status_display: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  priority_display: string;
  due_date?: string;
  completed_at?: string;
  project: number;
  project_name: string;
  assigned_to?: number;
  assigned_to_name?: string;
  created_by: number;
  created_by_name: string;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: number;
  user: number;
  user_name: string;
  user_email: string;
  role: 'manager' | 'developer' | 'designer' | 'tester' | 'observer';
  role_display: string;
  joined_at: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'collaborator' | 'viewer';
  phone?: string;
  password: string;
  password_confirm: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
