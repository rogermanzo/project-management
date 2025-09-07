import React from 'react';
import { Alert } from '@mui/material';

interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
  severity?: 'error' | 'warning' | 'info' | 'success';
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  message, 
  onClose, 
  severity = 'error' 
}) => {
  return (
    <Alert 
      severity={severity} 
      sx={{ mb: 2 }} 
      onClose={onClose}
    >
      {message}
    </Alert>
  );
};

export default ErrorAlert;
