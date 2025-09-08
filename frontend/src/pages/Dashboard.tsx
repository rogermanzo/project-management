import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Assignment,
  CheckCircle,
  Schedule,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { projectService, taskService } from '../services/api';
import { Project, Task } from '../types';
import { PageHeader, Loading, ErrorAlert } from '../components/Common';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [projectsData, tasksData] = await Promise.all([
          projectService.getProjects(),
          taskService.getUserTasks(), // Obtener todas las tareas
        ]);
        
        setProjects(projectsData.slice(0, 5)); // Últimos 5 proyectos
        setAllTasks(tasksData.tasks); // Guardar todas las tareas para estadísticas
        
        // Filtrar tareas que no estén completadas (pendientes y en progreso)
        const pendingTasks = tasksData.tasks.filter(task => 
          task.status !== 'completed' && task.status !== 'cancelled'
        );
        setTasks(pendingTasks.slice(0, 10)); // Últimas 10 tareas pendientes/en progreso
      } catch (error: any) {
        setError('Error al cargar los datos del dashboard');
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'on_hold':
        return 'warning';
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

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setViewingTask(null);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return <Loading message="Cargando dashboard..." />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorAlert message={error} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={`¡Bienvenido, ${user?.first_name}!`}
        subtitle="Aquí tienes un resumen de tus proyectos y tareas"
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Estadísticas rápidas */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assignment color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{projects.length}</Typography>
                  <Typography color="text.secondary">Proyectos</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {allTasks.filter(task => task.status === 'completed').length}
                  </Typography>
                  <Typography color="text.secondary">Tareas Completadas</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Schedule color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {allTasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled').length}
                  </Typography>
                  <Typography color="text.secondary">Tareas Pendientes</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {Math.round(projects.reduce((acc, project) => acc + project.progress_percentage, 0) / projects.length) || 0}%
                  </Typography>
                  <Typography color="text.secondary">Progreso Promedio</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Proyectos recientes y tareas pendientes */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Card sx={{ flex: '1 1 400px', minWidth: '400px' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Proyectos Recientes</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => navigate('/projects')}
                >
                  Ver Todos
                </Button>
              </Box>
              
              {projects.length === 0 ? (
                <Typography color="text.secondary" align="center" py={2}>
                  No tienes proyectos aún
                </Typography>
              ) : (
                <List>
                  {projects.map((project, index) => (
                    <React.Fragment key={project.id}>
                      <ListItem
                        component="div"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                      >
                        <ListItemIcon>
                          <Assignment />
                        </ListItemIcon>
                        <ListItemText
                          primary={project.name}
                          secondary={
                            <Typography component="div" variant="body2" color="text.secondary">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={project.status_display}
                                  size="small"
                                  color={getStatusColor(project.status) as any}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {project.progress_percentage}% completado
                                </Typography>
                              </Box>
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < projects.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
          <Card sx={{ flex: '1 1 400px', minWidth: '400px' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Tareas Pendientes</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => navigate('/tasks')}
                >
                  Ver Todas
                </Button>
              </Box>
              
              {tasks.length === 0 ? (
                <Typography color="text.secondary" align="center" py={2}>
                  No tienes tareas asignadas
                </Typography>
              ) : (
                <List>
                  {tasks.slice(0, 5).map((task, index) => (
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
                          primary={task.title}
                          secondary={
                            <Typography component="div" variant="body2" color="text.secondary">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={task.status_display}
                                  size="small"
                                  color={getTaskStatusColor(task.status) as any}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {task.project_name}
                                </Typography>
                              </Box>
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < Math.min(tasks.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

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
                    color={getTaskStatusColor(viewingTask.status) as any}
                    variant="outlined"
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Prioridad
                  </Typography>
                  <Chip
                    label={viewingTask.priority_display}
                    color="default"
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
          <Button
            variant="contained"
            onClick={() => {
              handleCloseViewDialog();
              navigate('/tasks');
            }}
          >
            Ver en Tareas
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
