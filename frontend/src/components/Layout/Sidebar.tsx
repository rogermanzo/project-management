import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Chip,
  Collapse,
} from '@mui/material';
import { IconButton, Tooltip, Button } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import {
  Home,
  Task,
  Settings,
  Logout,
  Folder,
  Description,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ConfirmDialog from '../Common/ConfirmDialog';
import NotificationBell from '../Notifications/NotificationBell';

import { useNavigate, useLocation } from 'react-router-dom';
import { projectService } from '../../services/api';
import { Project } from '../../types';

const drawerWidth = 280;

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  const { mode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsData = await projectService.getProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      navigate('/login');
    }
  };

  const handleProjectsToggle = () => {
    setProjectsExpanded(!projectsExpanded);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'collaborator':
        return 'warning';
      case 'viewer':
        return 'info';
      default:
        return 'default';
    }
  };

  const generalItems = [
    {
      text: 'Inicio',
      icon: <Home />,
      path: '/dashboard',
    },
    {
      text: 'Tareas',
      icon: <Task />,
      path: '/tasks',
    },
  ];


  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography sx={{ fontWeight: 'bold' }}>
          Gestión Proyectos
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationBell />
          <IconButton aria-label="Cambiar tema" onClick={toggleTheme} color="inherit">
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Box>
      </Box>

      {/* User Info */}
      
      {/* Navigation */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* General Section */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            General
          </Typography>
        </Box>
        <List dense>
          {generalItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive(item.path)}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'action.selected',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive(item.path) ? 'bold' : 'normal',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Project Section */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Proyectos
          </Typography>
        </Box>
        <List dense>
          {/* Projects header with expand/collapse */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleProjectsToggle}
              sx={{
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Folder />
              </ListItemIcon>
              <ListItemText
                primary="Proyectos"
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 'normal',
                }}
              />
              {projectsExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          
          {/* Individual projects */}
          <Collapse in={projectsExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding dense>
              {isLoading ? (
                <ListItem>
                  <ListItemText
                    primary="Cargando proyectos..."
                    primaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
                    sx={{ pl: 4 }}
                  />
                </ListItem>
              ) : projects.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No hay proyectos"
                    primaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
                    sx={{ pl: 4 }}
                  />
                </ListItem>
              ) : (
                projects.map((project) => (
                  <ListItem key={project.id} disablePadding>
                    <ListItemButton
                      onClick={() => navigate(`/projects/${project.id}`)}
                      selected={isActive(`/projects/${project.id}`)}
                      sx={{
                        borderRadius: 1,
                        mx: 1,
                        mb: 0.5,
                        pl: 4,
                        '&.Mui-selected': {
                          backgroundColor: 'action.selected',
                          '&:hover': {
                            backgroundColor: 'action.selected',
                          },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Description />
                      </ListItemIcon>
                      <ListItemText
                        primary={project.name}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isActive(`/projects/${project.id}`) ? 'bold' : 'normal',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>
          </Collapse>
        </List>

      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={user?.avatar}
              alt={user?.full_name}
              sx={{ width: 40, height: 40 }}
            >
              {user?.first_name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                {user?.full_name}
              </Typography>
              <Chip
                label={user?.role_display}
                color={getRoleColor(user?.role || '') as any}
                size="small"
                variant="outlined"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          <Tooltip title="Cerrar sesión">
            <IconButton onClick={() => setConfirmLogoutOpen(true)} color="inherit" size="small">
              <Logout />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Botón de Configuración destacado */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Settings />}
          onClick={() => navigate('/profile')}
          sx={{ mt: 2, textTransform: 'none' }}
        >
          Configuración
        </Button>
      </Box>
    </Box>
    
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: 'background.paper',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid',
            borderColor: 'divider',
            position: 'fixed',
            height: '100vh',
            zIndex: 1,
            backgroundColor: 'background.paper',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Confirmación de cierre de sesión */}
      <ConfirmDialog
        open={confirmLogoutOpen}
        title="Cerrar sesión"
        description="¿Seguro que quieres cerrar sesión? Tendrás que volver a iniciar sesión para continuar."
        confirmText="Cerrar sesión"
        cancelText="Cancelar"
        confirmColor="error"
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={async () => {
          await handleLogout();
          setConfirmLogoutOpen(false);
        }}
      />
    </>
  );
};

export default Sidebar;
