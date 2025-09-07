import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { Refresh } from '@mui/icons-material';

interface AutoRefreshIndicatorProps {
  isRefreshing?: boolean;
  lastUpdated?: Date;
}

const AutoRefreshIndicator: React.FC<AutoRefreshIndicatorProps> = ({
  isRefreshing = false,
  lastUpdated
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1, 
      opacity: 0.7,
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 1
    }}>
      {isRefreshing && (
        <CircularProgress size={16} />
      )}
      <Refresh 
        fontSize="small" 
        sx={{ 
          animation: isRefreshing ? 'spin 2s linear infinite' : 'none',
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' }
          }
        }} 
      />
      {lastUpdated && (
        <Typography variant="caption" color="text.secondary">
          Actualizado: {lastUpdated.toLocaleTimeString()}
        </Typography>
      )}
    </Box>
  );
};

export default AutoRefreshIndicator;
