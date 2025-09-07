import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SmartRedirect: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Si está cargando, no redirigir aún
  if (isLoading) {
    return null;
  }

  // Si está autenticado, ir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si no está autenticado, ir al login
  return <Navigate to="/login" replace />;
};

export default SmartRedirect;
