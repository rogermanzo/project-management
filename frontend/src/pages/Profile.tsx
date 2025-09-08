import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  CalendarToday,
  Security,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import  ConfirmDialog  from '../components/Common/ConfirmDialog';

const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    });
    setError(null);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await updateUser(formData);
      setSuccess('Perfil actualizado exitosamente');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError('Error al actualizar el perfil');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.changePassword(passwordData);
      setSuccess('Contraseña actualizada exitosamente');
      setOpenPasswordDialog(false);
      setPasswordData({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError('Error al cambiar la contraseña');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
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

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Mi Perfil
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Gestiona tu información personal y configuración de cuenta
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Información del perfil */}
        <Card sx={{ flex: '1 1 400px', minWidth: '400px', borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Información Personal</Typography>
              {!isEditing ? (
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={handleEdit}
                >
                  Editar
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Guardando...' : 'Guardar'}
                  </Button>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ width: 80, height: 80, mr: 3 }}
                src={user.avatar}
              >
                {user.first_name?.[0]}{user.last_name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {user.full_name}
                </Typography>
                <Chip
                  label={user.role_display}
                  color={getRoleColor(user.role) as any}
                  variant="outlined"
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  label="Apellido"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  disabled={!isEditing}
                />
              </Box>

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <TextField
                fullWidth
                label="Usuario"
                value={user.username}
                disabled
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Información de la cuenta */}
        <Card sx={{ flex: '1 1 300px', minWidth: '300px', borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Información de la Cuenta
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CalendarToday sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Miembro desde
                  </Typography>
                  <Typography variant="body1">
                    {new Date(user.date_joined).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              {user.last_login && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CalendarToday sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Último acceso
                    </Typography>
                    <Typography variant="body1">
                      {new Date(user.last_login).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Security sx={{ color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Estado de verificación
                  </Typography>
                  <Chip
                    label={user.is_verified ? 'Verificado' : 'No verificado'}
                    color={user.is_verified ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Security />}
                onClick={() => setOpenPasswordDialog(true)}
                fullWidth
              >
                Cambiar Contraseña
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={() => setConfirmLogoutOpen(true)}
                fullWidth
              >
                Cerrar Sesión
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Dialog para cambiar contraseña */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cambiar Contraseña</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Contraseña Actual"
              type="password"
              value={passwordData.old_password}
              onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Nueva Contraseña"
              type="password"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Confirmar Nueva Contraseña"
              type="password"
              value={passwordData.new_password_confirm}
              onChange={(e) => setPasswordData({ ...passwordData, new_password_confirm: e.target.value })}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={isLoading || !passwordData.old_password || !passwordData.new_password || passwordData.new_password !== passwordData.new_password_confirm}
          >
            {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
          </Button>
        </DialogActions>
      </Dialog>

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
          try {
            await logout();
          } finally {
            setConfirmLogoutOpen(false);
            navigate('/login', { replace: true });
          }
        }}
      />
    </Box>
  );
};

export default Profile;
