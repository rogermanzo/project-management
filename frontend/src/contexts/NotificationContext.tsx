import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notificationService } from '../services/api';

interface Notification {
  id: number;
  type: string;
  type_display: string;
  title: string;
  message: string;
  is_read: boolean;
  project?: {
    id: number;
    name: string;
  };
  task?: {
    id: number;
    title: string;
  };
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      // Asegurar que siempre sea un array
      const notificationsArray = Array.isArray(data) ? data : [];
      setNotifications(notificationsArray);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 401) {
        console.log('Error de autenticación en notificaciones');
        // No hacer nada, el interceptor de Axios se encargará del refresh
      }
      setNotifications([]); // En caso de error, establecer array vacío
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.count);
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      if (error.response?.status === 401) {
        console.log('Error de autenticación en conteo de notificaciones');
        // No hacer nada, el interceptor de Axios se encargará del refresh
      }
      setUnreadCount(0); // En caso de error, establecer conteo en 0
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => {
      const currentNotifications = Array.isArray(prev) ? prev : [];
      return [notification, ...currentNotifications];
    });
    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => {
        const currentNotifications = Array.isArray(prev) ? prev : [];
        return currentNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        );
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => {
        const currentNotifications = Array.isArray(prev) ? prev : [];
        return currentNotifications.map(notification => ({ ...notification, is_read: true }));
      });
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    // Por ahora, solo usar APIs REST sin WebSocket
    // TODO: Implementar WebSocket cuando el servidor esté configurado con ASGI
    console.log('Sistema de notificaciones iniciado (modo REST)');
  }, []);

  useEffect(() => {
    // Cargar notificaciones iniciales
    fetchNotifications();
    fetchUnreadCount();
    
    // Actualizar notificaciones cada 30 segundos
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    fetchUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
