import React from 'react';
import { Box, Card, CardContent, Typography, Button, List, ListItem, ListItemIcon, ListItemText, Divider, Chip } from '@mui/material';
import { Add, Assignment } from '@mui/icons-material';
import { Project } from '../../types';

interface RecentProjectsProps {
  projects: Project[];
  onViewAll: () => void;
  onProjectClick: (projectId: number | string) => void;
}

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

const RecentProjects: React.FC<RecentProjectsProps> = ({ projects, onViewAll, onProjectClick }) => {
  return (
    <Card sx={{ flex: '1 1 400px', minWidth: '400px', borderRadius: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Proyectos Recientes</Typography>
          <Button variant="outlined" size="small" startIcon={<Add />} onClick={onViewAll}>
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
                  onClick={() => onProjectClick(project.id)}
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
                          <Chip label={project.status_display} size="small" color={getStatusColor(project.status) as any} />
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
  );
};

export default RecentProjects;
