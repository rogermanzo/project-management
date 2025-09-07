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
import { useNavigate, useLocation } from 'react-router-dom';
import { projectService } from '../../services/api';
import { Project } from '../../types';

const drawerWidth = 280;

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

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
          justifyContent: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Gestión Proyectos
        </Typography>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Avatar
            src={user?.avatar}
            alt={user?.full_name}
            sx={{ width: 40, height: 40 }}
          >
            {user?.first_name?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {user?.full_name}
            </Typography>
            <Chip
              label={user?.role_display}
              color={getRoleColor(user?.role || '') as any}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

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

      {/* Footer Actions */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <List dense>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => navigate('/profile')}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Settings />
              </ListItemIcon>
              <ListItemText
                primary="Configuración"
                primaryTypographyProps={{ fontSize: '0.875rem' }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Logout />
              </ListItemIcon>
              <ListItemText
                primary="Cerrar Sesión"
                primaryTypographyProps={{ fontSize: '0.875rem' }}
              />
            </ListItemButton>
          </ListItem>
        </List>
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
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
