import React from 'react';
import { Box, Card, CardContent, Typography, Button, List, ListItem, ListItemIcon, ListItemText, Divider, Chip } from '@mui/material';
import { Add, Assignment } from '@mui/icons-material';
import { Task } from '../../types';

interface PendingTasksProps {
  tasks: Task[];
  onViewAll: () => void;
  onTaskClick: (task: Task) => void;
}

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

const PendingTasks: React.FC<PendingTasksProps> = ({ tasks, onViewAll, onTaskClick }) => {
  return (
    <Card sx={{ flex: '1 1 400px', minWidth: '400px', borderRadius: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Tareas Pendientes</Typography>
          <Button variant="outlined" size="small" startIcon={<Add />} onClick={onViewAll}>
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
                  onClick={() => onTaskClick(task)}
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
                          <Chip label={task.status_display} size="small" color={getTaskStatusColor(task.status) as any} />
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
  );
};

export default PendingTasks;
