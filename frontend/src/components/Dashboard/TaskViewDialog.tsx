import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Chip,
  Button,
} from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { Task } from '../../types';

interface TaskViewDialogProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onGoToTasks: () => void;
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

const TaskViewDialog: React.FC<TaskViewDialogProps> = ({ open, task, onClose, onGoToTasks }) => {
  if (!task) return null;

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assignment />
          <Typography variant="h6">{task.title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Descripción
            </Typography>
            <Typography variant="body1">{task.description || 'Sin descripción'}</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Estado
              </Typography>
              <Chip label={task.status_display} color={getTaskStatusColor(task.status) as any} variant="outlined" />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Prioridad
              </Typography>
              <Chip label={task.priority_display} color="default" variant="outlined" />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Proyecto
            </Typography>
            <Typography variant="body1">{task.project_name}</Typography>
          </Box>

          {task.assigned_to_name && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Asignado a
              </Typography>
              <Typography variant="body1">{task.assigned_to_name}</Typography>
            </Box>
          )}

          {task.due_date && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Fecha Límite
              </Typography>
              <Typography variant="body1">
                {new Date(task.due_date).toLocaleDateString()}
                {isOverdue(task.due_date) && (
                  <Chip label="Vencida" size="small" color="error" variant="outlined" sx={{ ml: 1 }} />
                )}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Creada
              </Typography>
              <Typography variant="body2">{new Date(task.created_at).toLocaleDateString()}</Typography>
            </Box>
            {task.updated_at && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Actualizada
                </Typography>
                <Typography variant="body2">{new Date(task.updated_at).toLocaleDateString()}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="contained" onClick={onGoToTasks}>
          Ver en Tareas
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskViewDialog;
