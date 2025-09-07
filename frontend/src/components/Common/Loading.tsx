import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingProps {
  minHeight?: string | number;
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  minHeight = '400px',
  message = 'Cargando...'
}) => {
  return (
    <Box 
      display="flex" 
      flexDirection="column"
      justifyContent="center" 
      alignItems="center" 
      minHeight={minHeight}
      gap={2}
    >
      <CircularProgress />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default Loading;
