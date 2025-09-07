import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Assignment,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { taskService, userService, projectService } from '../services/api';
import { Task, User, Project } from '../types';
import { PageHeader, Loading, ErrorAlert } from '../components/Common';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`task-tabpanel-${index}`}
      aria-labelledby={`task-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: '',
    project: '',
    assigned_to: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchUsersAndProjects();
  }, []);

  // Actualizar tareas automáticamente cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUsersAndProjects = async () => {
    try {
      const [usersData, projectsData] = await Promise.all([
        userService.getUsers(),
        projectService.getProjects(),
      ]);
      setUsers(usersData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error al cargar usuarios y proyectos:', error);
    }
  };

  // Filtrar usuarios que están asignados al proyecto seleccionado
  const getAvailableUsers = () => {
    if (!formData.project) return users;
    
    const selectedProject = projects.find(p => p.id.toString() === formData.project);
    if (!selectedProject) return users;
    
    // Por ahora retornamos todos los usuarios, pero aquí se podría filtrar
    // por los usuarios que están realmente asignados al proyecto
    return users;
  };

  // Filtrar tareas según la pestaña activa
  const getFilteredTasks = () => {
    switch (tabValue) {
      case 0: // Todas
        return tasks;
      case 1: // Pendientes
        return tasks.filter(task => task.status === 'pending');
      case 2: // En Progreso
        return tasks.filter(task => task.status === 'in_progress');
      case 3: // Completadas
        return tasks.filter(task => task.status === 'completed');
      default:
        return tasks;
    }
  };

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      // Cargar todas las tareas sin filtro
      const data = await taskService.getUserTasks();
      setTasks(data.tasks);
    } catch (error: any) {
      setError('Error al cargar las tareas');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        project: task.project.toString(),
        assigned_to: task.assigned_to?.toString() || '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
        due_date: '',
        project: '',
        assigned_to: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
      due_date: '',
      project: '',
      assigned_to: '',
    });
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setViewingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que se haya seleccionado un proyecto
    if (!formData.project) {
      setError('Debe seleccionar un proyecto');
      return;
    }
    
    // Validar que se haya asignado un usuario
    if (!formData.assigned_to) {
      setError('Debe asignar la tarea a un usuario');
      return;
    }
    
    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        project: Number(formData.project),
        assigned_to: Number(formData.assigned_to),
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
      };

      if (editingTask) {
        await taskService.updateTask(editingTask.id, taskData);
      } else {
        await taskService.createTask(taskData);
      }
      await fetchTasks();
      handleCloseDialog();
    } catch (error: any) {
      setError('Error al guardar la tarea');
      console.error('Error:', error);
    }
  };

  const handleDelete = async (task: Task) => {
    if (window.confirm(`¿Estás seguro de eliminar la tarea "${task.title}"?`)) {
      try {
        await taskService.deleteTask(task.id);
        await fetchTasks();
      } catch (error: any) {
        setError('Error al eliminar la tarea');
        console.error('Error:', error);
      }
    }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await taskService.updateTaskStatus(task.id, newStatus);
      await fetchTasks();
    } catch (error: any) {
      setError('Error al actualizar el estado de la tarea');
      console.error('Error:', error);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  if (isLoading) {
    return <Loading message="Cargando tareas..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Mis Tareas"
        subtitle="Gestiona todas tus tareas asignadas"
        showButton={true}
        buttonText="Nueva Tarea"
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

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Todas" />
            <Tab label="Pendientes" />
            <Tab label="En Progreso" />
            <Tab label="Completadas" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Todas las Tareas ({getFilteredTasks().length})
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Tareas Pendientes ({getFilteredTasks().length})
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Tareas en Progreso ({getFilteredTasks().length})
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Tareas Completadas ({getFilteredTasks().length})
          </Typography>
        </TabPanel>

        {getFilteredTasks().length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay tareas en esta categoría
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {tabValue === 0 && 'No tienes tareas asignadas aún'}
              {tabValue === 1 && 'No tienes tareas pendientes'}
              {tabValue === 2 && 'No tienes tareas en progreso'}
              {tabValue === 3 && 'No tienes tareas completadas'}
            </Typography>
          </Box>
        ) : (
          <List>
            {getFilteredTasks().map((task, index) => (
              <React.Fragment key={task.id}>
                <ListItem
                  component="div"
                  onClick={() => handleViewTask(task)}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                >
                  <ListItemIcon>
                    <Assignment />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {task.title}
                        </Typography>
                        {task.due_date && isOverdue(task.due_date) && (
                          <Chip
                            label="Vencida"
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {task.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                          {/* Estado */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              Estado:
                            </Typography>
                            {(user?.can_edit_projects || task.assigned_to === user?.id) ? (
                              <FormControl size="small" sx={{ minWidth: 100 }}>
                                <Select
                                  value={task.status}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(task, e.target.value);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  sx={{ 
                                    '& .MuiSelect-select': { 
                                      py: 0.5,
                                      fontSize: '0.75rem',
                                      color: getStatusColor(task.status) === 'success' ? 'success.main' :
                                             getStatusColor(task.status) === 'warning' ? 'warning.main' :
                                             getStatusColor(task.status) === 'info' ? 'info.main' :
                                             getStatusColor(task.status) === 'error' ? 'error.main' : 'text.primary'
                                    }
                                  }}
                                >
                                  <MenuItem value="pending">Pendiente</MenuItem>
                                  <MenuItem value="in_progress">En Progreso</MenuItem>
                                  <MenuItem value="completed">Completado</MenuItem>
                                  <MenuItem value="cancelled">Cancelado</MenuItem>
                                </Select>
                              </FormControl>
                            ) : (
                              /* Mostrar solo el estado como texto si no puede editar */
                              <Chip
                                label={task.status_display}
                                size="small"
                                color={getStatusColor(task.status) as any}
                                variant="outlined"
                              />
                            )}
                          </Box>
                          
                          {/* Prioridad */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              Prioridad:
                            </Typography>
                            <Chip
                              label={task.priority_display}
                              size="small"
                              color={getPriorityColor(task.priority) as any}
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Proyecto: {task.project_name} • 
                          {task.due_date && ` Vence: ${new Date(task.due_date).toLocaleDateString()}`}
                          {task.assigned_to_name && ` • Asignado a: ${task.assigned_to_name}`}
                        </Typography>
                      </Box>
                    }
                  />
                  {(user?.can_edit_projects || task.assigned_to === user?.id) && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(task);
                        }}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      {user?.can_edit_projects && (
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task);
                          }}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </ListItem>
                {index < getFilteredTasks().length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Card>

      {/* Dialog para crear/editar tarea */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                fullWidth
                label="Título de la Tarea"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                <FormControl fullWidth>
                  <InputLabel>Proyecto</InputLabel>
                  <Select
                    value={formData.project}
                    label="Proyecto"
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      project: e.target.value,
                      assigned_to: '' // Limpiar usuario asignado al cambiar proyecto
                    })}
                    required
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel>Asignado a</InputLabel>
                  <Select
                    value={formData.assigned_to}
                    label="Asignado a"
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    required
                  >
                    <MenuItem value="" disabled>
                      <em>Seleccione un usuario</em>
                    </MenuItem>
                    {getAvailableUsers().map((user) => (
                      <MenuItem key={user.id} value={user.id.toString()}>
                        {user.full_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <TextField
                fullWidth
                label="Fecha Límite"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingTask ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Modal para visualizar tarea */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment />
            <Typography variant="h6">
              {viewingTask?.title}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {viewingTask && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              {/* Descripción */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Descripción
                </Typography>
                <Typography variant="body1">
                  {viewingTask.description || 'Sin descripción'}
                </Typography>
              </Box>

              {/* Estado y Prioridad */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Estado
                  </Typography>
                  <Chip
                    label={viewingTask.status_display}
                    color={getStatusColor(viewingTask.status) as any}
                    variant="outlined"
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Prioridad
                  </Typography>
                  <Chip
                    label={viewingTask.priority_display}
                    color={getPriorityColor(viewingTask.priority) as any}
                    variant="outlined"
                  />
                </Box>
              </Box>

              {/* Información del Proyecto */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Proyecto
                </Typography>
                <Typography variant="body1">
                  {viewingTask.project_name}
                </Typography>
              </Box>

              {/* Usuario Asignado */}
              {viewingTask.assigned_to_name && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Asignado a
                  </Typography>
                  <Typography variant="body1">
                    {viewingTask.assigned_to_name}
                  </Typography>
                </Box>
              )}

              {/* Fecha Límite */}
              {viewingTask.due_date && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Fecha Límite
                  </Typography>
                  <Typography variant="body1">
                    {new Date(viewingTask.due_date).toLocaleDateString()}
                    {isOverdue(viewingTask.due_date) && (
                      <Chip
                        label="Vencida"
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                </Box>
              )}

              {/* Fechas de Creación y Actualización */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Creada
                  </Typography>
                  <Typography variant="body2">
                    {new Date(viewingTask.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
                {viewingTask.updated_at && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Actualizada
                    </Typography>
                    <Typography variant="body2">
                      {new Date(viewingTask.updated_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Cerrar</Button>
          {(user?.can_edit_projects || viewingTask?.assigned_to === user?.id) && viewingTask && (
            <Button
              variant="contained"
              onClick={() => {
                handleCloseViewDialog();
                handleOpenDialog(viewingTask);
              }}
            >
              Editar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;
