import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { Assignment, CheckCircle, Schedule, TrendingUp } from '@mui/icons-material';
import { Project, Task } from '../../types';

interface QuickStatsProps {
  projects: Project[];
  allTasks: Task[];
}

const QuickStats: React.FC<QuickStatsProps> = ({ projects, allTasks }) => {
  const totalProjects = projects.length;
  const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = allTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length;
  const avgProgress = totalProjects
    ? Math.round(projects.reduce((acc, p) => acc + p.progress_percentage, 0) / totalProjects)
    : 0;

  return (
    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      <Card sx={{ flex: '1 1 200px', minWidth: '200px', borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center">
            <Assignment color="primary" sx={{ mr: 2 }} />
            <Box>
              <Typography variant="h4">{totalProjects}</Typography>
              <Typography color="text.secondary">Proyectos</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ flex: '1 1 200px', minWidth: '200px', borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center">
            <CheckCircle color="success" sx={{ mr: 2 }} />
            <Box>
              <Typography variant="h4">{completedTasks}</Typography>
              <Typography color="text.secondary">Tareas Completadas</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ flex: '1 1 200px', minWidth: '200px', borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center">
            <Schedule color="warning" sx={{ mr: 2 }} />
            <Box>
              <Typography variant="h4">{pendingTasks}</Typography>
              <Typography color="text.secondary">Tareas Pendientes</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ flex: '1 1 200px', minWidth: '200px', borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center">
            <TrendingUp color="info" sx={{ mr: 2 }} />
            <Box>
              <Typography variant="h4">{avgProgress}%</Typography>
              <Typography color="text.secondary">Progreso Promedio</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QuickStats;
