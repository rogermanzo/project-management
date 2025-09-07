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
  Tabs,
  Tab,
  Avatar,
  AvatarGroup,
  LinearProgress,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  Badge,
} from '@mui/material';
import {
  Add,
  Assignment,
  CheckCircle,
  Schedule,
  TrendingUp,
  Home,
  Inbox,
  Group,
  Person,
  Create,
  Search,
  FilterList,
  MoreVert,
  Share,
  Notifications,
  Dashboard as DashboardIcon,
  Timeline,
  CalendarToday,
  ViewModule,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { projectService, taskService } from '../services/api';
import { Project, Task } from '../types';
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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [projectsData, tasksData] = await Promise.all([
          projectService.getProjects(),
          taskService.getUserTasks(),
        ]);
        
        setProjects(projectsData);
        setAllTasks(tasksData.tasks);
        
        // Si hay un proyecto seleccionado, filtrar tareas por proyecto
        if (selectedProject) {
          const projectTasks = tasksData.tasks.filter(task => 
            task.project === selectedProject.id
          );
          setTasks(projectTasks);
        } else {
          setTasks(tasksData.tasks);
        }
      } catch (error: any) {
        setError('Error al cargar los datos del dashboard');
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Actualizar datos cada 30 segundos
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, [selectedProject]);

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

  // Filtrar tareas por estado
  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  // Filtrar tareas por búsqueda
  const getFilteredTasks = (status?: string) => {
    let filtered = tasks;
    
    if (status) {
      filtered = filtered.filter(task => task.status === status);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Obtener iniciales del nombre
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Renderizar avatar de usuario
  const renderUserAvatar = (userName: string, size: number = 32) => {
    return (
      <Avatar sx={{ width: size, height: size, fontSize: size * 0.4 }}>
        {getInitials(userName)}
      </Avatar>
    );
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
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'grey.50' }}>
      {/* Sidebar */}
      <Box sx={{ 
        width: 280, 
        bgcolor: 'white', 
        borderRight: 1, 
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Logo y nombre */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DashboardIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              GestionPro
                  </Typography>
                </Box>
              </Box>

        {/* Navegación principal */}
        <Box sx={{ p: 2, flex: 1 }}>
          <List sx={{ '& .MuiListItemButton-root': { borderRadius: 1, mb: 0.5 } }}>
            <ListItem disablePadding>
              <Button
                fullWidth
                startIcon={<Home />}
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Button>
            </ListItem>
            <ListItem disablePadding>
              <Button
                fullWidth
                startIcon={<Inbox />}
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                onClick={() => navigate('/tasks')}
              >
                Inbox
              </Button>
            </ListItem>
            <ListItem disablePadding>
              <Button
                fullWidth
                startIcon={<Group />}
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                onClick={() => navigate('/projects')}
              >
                Teams
              </Button>
            </ListItem>
            <ListItem disablePadding>
              <Button
                fullWidth
                startIcon={<Person />}
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                onClick={() => navigate('/tasks')}
              >
                Assigned to me
              </Button>
            </ListItem>
            <ListItem disablePadding>
              <Button
                fullWidth
                startIcon={<Create />}
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                onClick={() => navigate('/tasks')}
              >
                Created by me
              </Button>
            </ListItem>
          </List>

          {/* Favoritos */}
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, px: 2, color: 'text.secondary' }}>
            Favorites
                  </Typography>
          <Box sx={{ px: 2 }}>
            <Button
              startIcon={<Add />}
              sx={{ textTransform: 'none', color: 'text.secondary' }}
            >
              Add
            </Button>
        </Box>

          {/* Proyectos */}
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, px: 2, color: 'text.secondary' }}>
            Projects
          </Typography>
          <List sx={{ '& .MuiListItemButton-root': { borderRadius: 1, mb: 0.5 } }}>
            {projects.map((project) => (
              <ListItem key={project.id} disablePadding>
                <Button
                  fullWidth
                  sx={{ 
                    justifyContent: 'flex-start', 
                    textTransform: 'none',
                    bgcolor: selectedProject?.id === project.id ? 'primary.light' : 'transparent',
                    color: selectedProject?.id === project.id ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      bgcolor: selectedProject?.id === project.id ? 'primary.main' : 'action.hover'
                    }
                  }}
                  onClick={() => setSelectedProject(project)}
                >
                  {project.name}
                </Button>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <Button
                startIcon={<Add />}
                sx={{ textTransform: 'none', color: 'text.secondary', px: 2 }}
                onClick={() => navigate('/projects')}
              >
                Add
              </Button>
            </ListItem>
          </List>
        </Box>

        {/* Usuario */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {renderUserAvatar(user?.full_name || 'Usuario', 40)}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {user?.full_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>
              </Box>
              
      {/* Contenido principal */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ 
          bgcolor: 'white', 
          borderBottom: 1, 
          borderColor: 'divider',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Breadcrumbs>
            <Link color="inherit" href="#" onClick={() => navigate('/projects')}>
              Projects
            </Link>
            <Typography color="text.primary">
              {selectedProject ? selectedProject.name : 'All Projects'}
                </Typography>
          </Breadcrumbs>

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton>
              <Badge badgeContent={1} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            <IconButton>
              <Share />
            </IconButton>
            <TextField
              size="small"
              placeholder="Search task..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 200 }}
            />
            <IconButton>
              <FilterList />
            </IconButton>
            <IconButton>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Spreadsheet" />
            <Tab label="Timeline" />
            <Tab label="Calendar" />
            <Tab label="Board" />
            <Tab icon={<Add />} />
          </Tabs>
        </Box>

        {/* Contenido de tabs */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            {/* Vista Spreadsheet - Columnas por estado */}
            <Box sx={{ display: 'flex', gap: 3, height: '100%' }}>
              {/* Columna: In Progress */}
              <Card sx={{ flex: 1, minHeight: 600 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: 'warning.main' 
                    }} />
                    <Typography variant="h6">In Progress</Typography>
                                <Chip
                      label={getFilteredTasks('in_progress').length} 
                                  size="small"
                      color="warning" 
                    />
                  </Box>
                  
                  <List>
                    {getFilteredTasks('in_progress').map((task) => (
                      <Card key={task.id} sx={{ mb: 2, '&:hover': { boxShadow: 2 } }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            {task.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {task.description}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AvatarGroup max={3}>
                              {task.assigned_to_name && renderUserAvatar(task.assigned_to_name, 24)}
                            </AvatarGroup>
                                <Typography variant="caption" color="text.secondary">
                              {task.due_date && new Date(task.due_date).toLocaleDateString()}
                                </Typography>
                              </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip 
                              label={task.priority_display} 
                              size="small" 
                              color={getPriorityColor(task.priority) as any}
                              variant="outlined"
                            />
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={task.status === 'completed' ? 100 : 50} 
                                sx={{ height: 4, borderRadius: 2 }}
                              />
                            </Box>
                            <Typography variant="caption">
                              {task.status === 'completed' ? '100%' : '50%'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                  ))}
                </List>
                  
                <Button
                    fullWidth
                  variant="outlined"
                  startIcon={<Add />}
                    sx={{ mt: 2 }}
                  onClick={() => navigate('/tasks')}
                >
                    Add task
                </Button>
                </CardContent>
              </Card>

              {/* Columna: Ready to check by PM */}
              <Card sx={{ flex: 1, minHeight: 600 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main' 
                    }} />
                    <Typography variant="h6">Ready to check by PM</Typography>
                    <Chip 
                      label={getFilteredTasks('completed').length} 
                      size="small" 
                      color="primary" 
                    />
              </Box>
              
                  <List>
                    {getFilteredTasks('completed').map((task) => (
                      <Card key={task.id} sx={{ mb: 2, '&:hover': { boxShadow: 2 } }}>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            {task.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {task.description}
                </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AvatarGroup max={3}>
                              {task.assigned_to_name && renderUserAvatar(task.assigned_to_name, 24)}
                            </AvatarGroup>
                                <Typography variant="caption" color="text.secondary">
                              {task.due_date && new Date(task.due_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip 
                              label={task.priority_display} 
                              size="small" 
                              color={getPriorityColor(task.priority) as any}
                              variant="outlined"
                            />
                            <Box sx={{ flex: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={100} 
                                sx={{ height: 4, borderRadius: 2 }}
                              />
                            </Box>
                            <Typography variant="caption">100%</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                  ))}
                </List>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Add />}
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/tasks')}
                  >
                    Add task
                  </Button>
            </CardContent>
          </Card>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography>Timeline view - Coming soon</Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography>Calendar view - Coming soon</Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography>Board view - Coming soon</Typography>
          </TabPanel>
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
