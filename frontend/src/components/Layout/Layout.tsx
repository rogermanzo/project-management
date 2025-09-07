import React, { ReactNode, useState } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar open={sidebarOpen} onToggle={handleSidebarToggle} />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: 'background.default',
          ml: { md: '280px' }, // Account for desktop sidebar width
          width: { md: 'calc(100% - 280px)' }, // Adjust width to account for sidebar
        }}
      >
        {/* Top App Bar for mobile */}
        <AppBar
          position="fixed"
          sx={{
            display: { xs: 'block', md: 'none' },
            zIndex: (theme) => theme.zIndex.drawer + 1,
            width: { xs: '100%', md: 'calc(100% - 280px)' },
            ml: { md: '280px' },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleSidebarToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Gestión de Proyectos
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            mt: { xs: 7, md: 0 }, // Account for mobile app bar
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
