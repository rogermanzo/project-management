import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { projectService, taskService } from '../services/api';
import { Project, Task } from '../types';
import { PageHeader, Loading, ErrorAlert } from '../components/Common';
import QuickStats from '../components/Dashboard/QuickStats';
import RecentProjects from '../components/Dashboard/RecentProjects';
import PendingTasks from '../components/Dashboard/PendingTasks';
import TaskViewDialog from '../components/Dashboard/TaskViewDialog';

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
    // Nota: se eliminó el auto-refresh periódico para evitar recargas
    return () => {};
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
        <QuickStats projects={projects} allTasks={allTasks} />

        {/* Proyectos recientes y tareas pendientes */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <RecentProjects
            projects={projects}
            onViewAll={() => navigate('/projects')}
            onProjectClick={(id) => navigate(`/projects/${id}`)}
          />
          <PendingTasks
            tasks={tasks}
            onViewAll={() => navigate('/tasks')}
            onTaskClick={(task) => handleViewTask(task)}
          />
        </Box>
      </Box>

      {/* Modal para visualizar tarea */}
      <TaskViewDialog
        open={openViewDialog}
        task={viewingTask}
        onClose={handleCloseViewDialog}
        onGoToTasks={() => {
          handleCloseViewDialog();
          navigate('/tasks');
        }}
      />
    </Box>
  );
};

export default Dashboard;
