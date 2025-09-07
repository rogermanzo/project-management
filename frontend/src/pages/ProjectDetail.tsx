import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Edit,
  Add,
  Assignment,
  TrendingUp,
  Schedule,
  CheckCircle,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectService, taskService, userService } from '../services/api';
import { Project, Task, User } from '../types';

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
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: '',
    assigned_to: '',
  });

  useEffect(() => {
    if (id) {
      fetchProjectData();
      fetchUsers();
    }
  }, [id]);

  // Actualizar datos del proyecto automáticamente cada 30 segundos
  useEffect(() => {
    if (!id) return;

    const interval = setInterval(() => {
      fetchProjectData();
    }, 30000);

    return () => clearInterval(interval);
  }, [id]);

  const fetchUsers = async () => {
    try {
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      const [projectData, tasksData, membersData] = await Promise.all([
        projectService.getProject(Number(id)),
        taskService.getTasks(Number(id)),
        projectService.getProjectMembers(Number(id)),
      ]);
      setProject(projectData);
      setTasks(tasksData);
      setProjectMembers(membersData);
    } catch (error: any) {
      setError('Error al cargar los datos del proyecto');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTaskDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskFormData({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        assigned_to: task.assigned_to?.toString() || '',
      });
    } else {
      setEditingTask(null);
      setTaskFormData({
        title: '',
        description: '',
        status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
        due_date: '',
        assigned_to: '',
      });
    }
    setOpenTaskDialog(true);
  };

  const handleCloseTaskDialog = () => {
    setOpenTaskDialog(false);
    setEditingTask(null);
    setTaskFormData({
      title: '',
      description: '',
      status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
      priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
      due_date: '',
      assigned_to: '',
    });
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que se haya asignado un usuario
    if (!taskFormData.assigned_to) {
      setError('Debe asignar la tarea a un usuario');
      return;
    }
    
    try {
      const taskData = {
        title: taskFormData.title,
        description: taskFormData.description,
        status: taskFormData.status,
        priority: taskFormData.priority,
        assigned_to: Number(taskFormData.assigned_to),
        due_date: taskFormData.due_date ? new Date(taskFormData.due_date).toISOString() : undefined,
      };

      if (editingTask) {
        await taskService.updateTask(editingTask.id, taskData);
      } else {
        await taskService.createTask(taskData, Number(id));
      }
      await fetchProjectData();
      handleCloseTaskDialog();
    } catch (error: any) {
      setError('Error al guardar la tarea');
      console.error('Error:', error);
    }
  };

  const handleTaskStatusChange = async (task: Task, newStatus: string) => {
    try {
      await taskService.updateTaskStatus(task.id, newStatus);
      await fetchProjectData();
    } catch (error: any) {
      setError('Error al actualizar el estado de la tarea');
      console.error('Error:', error);
    }
  };

  const handleOpenMemberDialog = () => {
    setOpenMemberDialog(true);
    setSelectedUserId('');
  };

  const handleCloseMemberDialog = () => {
    setOpenMemberDialog(false);
    setSelectedUserId('');
  };

  const handleAddMember = async () => {
    if (!selectedUserId || !id) return;
    
    try {
      await projectService.addProjectMember(Number(id), Number(selectedUserId));
      await fetchProjectData();
      handleCloseMemberDialog();
    } catch (error: any) {
      setError('Error al agregar miembro al proyecto');
      console.error('Error:', error);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!id) return;
    
    try {
      await projectService.removeProjectMember(Number(id), memberId);
      await fetchProjectData();
    } catch (error: any) {
      setError('Error al remover miembro del proyecto');
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

  const getTaskStatusColor = (status: string) => {
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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Alert severity="error">
        Proyecto no encontrado
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {project.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {project.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip
                label={project.status_display}
                color={getStatusColor(project.status) as any}
              />
              <Chip
                label={project.priority_display}
                color="info"
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Propietario: {project.owner_name} • 
              Progreso: {project.progress_percentage}% • 
              Creado: {new Date(project.created_at).toLocaleDateString()}
            </Typography>
          </Box>
          {project.can_user_edit && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/projects/${project.id}/edit`)}
            >
              Editar Proyecto
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Resumen" />
            <Tab label="Tareas" />
            <Tab label="Miembros" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Card sx={{ flex: '1 1 200px' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assignment color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{tasks.length}</Typography>
                    <Typography color="text.secondary">Total Tareas</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ flex: '1 1 200px' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <CheckCircle color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {tasks.filter(task => task.status === 'completed').length}
                    </Typography>
                    <Typography color="text.secondary">Completadas</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ flex: '1 1 200px' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Schedule color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled').length}
                    </Typography>
                    <Typography color="text.secondary">Pendientes</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ flex: '1 1 200px' }}>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{project.progress_percentage}%</Typography>
                    <Typography color="text.secondary">Progreso</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Tareas del Proyecto</Typography>
            {project.can_user_edit && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenTaskDialog()}
              >
                Nueva Tarea
              </Button>
            )}
          </Box>

          {tasks.length === 0 ? (
            <Alert severity="info">
              No hay tareas en este proyecto aún
            </Alert>
          ) : (
            <List>
              {tasks.map((task, index) => (
                <React.Fragment key={task.id}>
                  <ListItem
                    component="div"
                    onClick={() => {
                      // Por ahora, no navegar a ningún lado ya que no hay página de detalle
                      // En el futuro se podría implementar un modal o página de detalle
                      console.log('Tarea clickeada:', task.id);
                    }}
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  >
                    <ListItemIcon>
                      <Assignment />
                    </ListItemIcon>
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <Box>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={task.status}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleTaskStatusChange(task, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                sx={{ 
                                  '& .MuiSelect-select': { 
                                    py: 0.5,
                                    fontSize: '0.75rem',
                                    color: getTaskStatusColor(task.status) === 'success' ? 'success.main' :
                                           getTaskStatusColor(task.status) === 'warning' ? 'warning.main' :
                                           getTaskStatusColor(task.status) === 'info' ? 'info.main' :
                                           getTaskStatusColor(task.status) === 'error' ? 'error.main' : 'text.primary'
                                  }
                                }}
                              >
                                <MenuItem value="pending">Pendiente</MenuItem>
                                <MenuItem value="in_progress">En Progreso</MenuItem>
                                <MenuItem value="completed">Completado</MenuItem>
                                <MenuItem value="cancelled">Cancelado</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {task.assigned_to_name && `Asignado a: ${task.assigned_to_name}`}
                            {task.due_date && ` • Vence: ${new Date(task.due_date).toLocaleDateString()}`}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < tasks.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Miembros del Proyecto
            </Typography>
            {user?.role === 'admin' && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenMemberDialog}
              >
                Agregar Miembro
              </Button>
            )}
          </Box>
          
          {projectMembers.length === 0 ? (
            <Alert severity="info">
              No hay miembros asignados a este proyecto
            </Alert>
          ) : (
            <List>
              {projectMembers.map((member, index) => (
                <React.Fragment key={member.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Assignment />
                    </ListItemIcon>
                    <ListItemText
                      primary={member.user_name}
                      secondary={`Rol: ${member.role_display} • Agregado: ${new Date(member.joined_at).toLocaleDateString()}`}
                    />
                    {user?.role === 'admin' && (
                      <Button
                        color="error"
                        onClick={() => handleRemoveMember(member.id)}
                        size="small"
                      >
                        Remover
                      </Button>
                    )}
                  </ListItem>
                  {index < projectMembers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>
      </Card>

      {/* Dialog para crear/editar tarea */}
      <Dialog open={openTaskDialog} onClose={handleCloseTaskDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
        </DialogTitle>
        <form onSubmit={handleTaskSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                fullWidth
                label="Título de la Tarea"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={3}
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={taskFormData.status}
                    label="Estado"
                    onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value as any })}
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
                    value={taskFormData.priority}
                    label="Prioridad"
                    onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as any })}
                  >
                    <MenuItem value="low">Baja</MenuItem>
                    <MenuItem value="medium">Media</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                    <MenuItem value="urgent">Urgente</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <FormControl fullWidth required>
                <InputLabel>Asignado a</InputLabel>
                <Select
                  value={taskFormData.assigned_to}
                  label="Asignado a"
                  onChange={(e) => setTaskFormData({ ...taskFormData, assigned_to: e.target.value })}
                  required
                >
                  <MenuItem value="" disabled>
                    <em>Seleccione un usuario</em>
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id.toString()}>
                      {user.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Fecha Límite"
                type="date"
                value={taskFormData.due_date}
                onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTaskDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingTask ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog para agregar miembro */}
      <Dialog open={openMemberDialog} onClose={handleCloseMemberDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Miembro al Proyecto</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Usuario</InputLabel>
            <Select
              value={selectedUserId}
              label="Usuario"
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
            >
              <MenuItem value="" disabled>
                <em>Seleccione un usuario</em>
              </MenuItem>
              {users
                .filter(user => !projectMembers.some(member => member.user === user.id))
                .map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.full_name} ({user.role_display})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMemberDialog}>Cancelar</Button>
          <Button 
            onClick={handleAddMember} 
            variant="contained"
            disabled={!selectedUserId}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetail;
