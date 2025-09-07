import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Assignment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectService, userService } from '../services/api';
import { Project, User } from '../types';
import { PageHeader, Loading, ErrorAlert } from '../components/Common';

const Projects: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  // Actualizar proyectos automáticamente cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProjects();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (error: any) {
      setError('Error al cargar los proyectos');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const handleOpenDialog = async (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        start_date: project.start_date,
        end_date: project.end_date || '',
      });
      
      // Cargar miembros del proyecto si es administrador
      if (user?.role === 'admin') {
        try {
          const members = await projectService.getProjectMembers(project.id);
          console.log('Miembros cargados:', members);
          const userIds = members.map((member: any) => member.user);
          console.log('User IDs extraídos:', userIds);
          setAssignedUsers(userIds);
        } catch (error) {
          console.error('Error al cargar miembros del proyecto:', error);
          setAssignedUsers([]);
        }
      }
    } else {
      setEditingProject(null);
      setFormData({
        name: '',
        description: '',
        status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
        start_date: '',
        end_date: '',
      });
      setAssignedUsers([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',

      status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
      start_date: '',
      end_date: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    
    try {
      if (editingProject) {
        await projectService.updateProject(editingProject.id, formData);
        
        // Si es administrador, manejar asignación de usuarios
        if (user?.role === 'admin') {
          console.log('Usuarios asignados seleccionados:', assignedUsers);
          
          // Obtener miembros actuales del proyecto
          const currentMembers = await projectService.getProjectMembers(editingProject.id);
          console.log('Miembros actuales del proyecto:', currentMembers);
          const currentUserIds = currentMembers.map((member: any) => member.user);
          console.log('IDs de usuarios actuales:', currentUserIds);
          
          // Agregar nuevos usuarios
          for (const userId of assignedUsers) {
            if (!currentUserIds.includes(userId)) {
              console.log('Agregando usuario:', userId);
              await projectService.addProjectMember(editingProject.id, userId);
            }
          }
          
          // Remover usuarios que ya no están asignados
          for (const member of currentMembers) {
            if (!assignedUsers.includes(member.user)) {
              console.log('Removiendo usuario:', member.user);
              await projectService.removeProjectMember(editingProject.id, member.id);
            }
          }
        }
      } else {
        await projectService.createProject(formData);
      }
      await fetchProjects();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error al guardar proyecto:', error);
      if (error.response?.data) {
        // Mostrar errores específicos del backend
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.values(errorData).flat();
          setError(`Error: ${errorMessages.join(', ')}`);
        } else {
          setError(`Error: ${errorData}`);
        }
      } else {
        setError('Error al guardar el proyecto');
      }
    }
  };

  const handleDelete = async (project: Project) => {
    if (window.confirm(`¿Estás seguro de eliminar el proyecto "${project.name}"?`)) {
      try {
        await projectService.deleteProject(project.id);
        await fetchProjects();
      } catch (error: any) {
        setError('Error al eliminar el proyecto');
        console.error('Error:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'pending':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return <Loading message="Cargando proyectos..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Proyectos"
        subtitle="Gestiona todos tus proyectos"
        showButton={true}
        buttonText="Nuevo Proyecto"
        buttonIcon={<Add />}
        onButtonClick={() => handleOpenDialog()}
        buttonCondition={user?.can_edit_projects || false}
      />

      {error && (
        <ErrorAlert 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}

      {projects.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tienes proyectos aún
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Crea tu primer proyecto para comenzar a gestionar tareas
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {projects.map((project) => (
            <Card key={project.id} sx={{ '&:hover': { boxShadow: 3 } }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {project.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        label={project.status_display}
                        color={getStatusColor(project.status) as any}
                        size="small"
                      />
                      <Chip
                        label={project.priority_display}
                        color={getPriorityColor(project.priority) as any}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Propietario: {project.owner_name} • 
                      Progreso: {project.progress_percentage}% • 
                      Tareas: {project.tasks_count} • 
                      Miembros: {project.members_count}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={() => navigate(`/projects/${project.id}`)}
                      color="primary"
                    >
                      <Visibility />
                    </IconButton>
                    {project.can_user_edit && (
                      <IconButton
                        onClick={() => handleOpenDialog(project)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                    )}
                    {project.can_user_delete && (
                      <IconButton
                        onClick={() => handleDelete(project)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Dialog para crear/editar proyecto */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                fullWidth
                label="Nombre del Proyecto"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.status}
                    label="Estado"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="in_progress">En Progreso</MenuItem>
                    <MenuItem value="completed">Completado</MenuItem>
                    <MenuItem value="cancelled">Cancelado</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Prioridad"
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  >
                    <MenuItem value="low">Baja</MenuItem>
                    <MenuItem value="medium">Media</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                    <MenuItem value="urgent">Urgente</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Fecha de Inicio"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
                <TextField
                  fullWidth
                  label="Fecha de Fin"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              
              {/* Campo para asignar usuarios (solo para administradores) */}
              {user?.role === 'admin' && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                    Usuarios Asignados al Proyecto
                  </Typography>
                  <Box sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1, 
                    p: 2, 
                    maxHeight: 200, 
                    overflow: 'auto',
                    backgroundColor: 'background.paper'
                  }}>
                    {users
                      .filter(u => u.role !== 'admin') // Solo colaboradores y visores
                      .map((user) => (
                        <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                          <Checkbox
                            checked={assignedUsers.includes(user.id)}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              if (e.target.checked) {
                                setAssignedUsers([...assignedUsers, user.id]);
                              } else {
                                setAssignedUsers(assignedUsers.filter(id => id !== user.id));
                              }
                            }}
                            size="small"
                          />
                          <Box sx={{ ml: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {user.full_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.role_display}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    {users.filter(u => u.role !== 'admin').length === 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        No hay colaboradores o visores disponibles
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingProject ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
};

export default Projects;
