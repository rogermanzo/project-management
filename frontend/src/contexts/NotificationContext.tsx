import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { notificationService } from '../services/api';
import { useAuth } from './AuthContext';

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
  isConnected: boolean;
  addNotification: (notification: Notification) => void;
  markAllAsRead: () => void;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  sendWebSocketMessage: (message: any) => void;
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
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Obtener token del localStorage
  const getToken = () => {
    return localStorage.getItem('access_token');
  };

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
      console.log('📊 Backend unread count:', data.count);
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
    console.log('🔔 Adding notification:', notification.id, notification.title);
    console.log('📊 Current unread count before:', unreadCount);
    
    setNotifications(prev => {
      const currentNotifications = Array.isArray(prev) ? prev : [];
      // Verificar si la notificación ya existe para evitar duplicados
      const exists = currentNotifications.some(n => n.id === notification.id);
      if (exists) {
        console.log('⚠️ Notification already exists, skipping');
        return currentNotifications;
      }
      console.log('✅ Adding new notification to list');
      return [notification, ...currentNotifications];
    });
    
    // Solo actualizar el contador si la notificación no está leída
    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1);
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

  // WebSocket connection functions
  const connectWebSocket = () => {
    const token = getToken();
    if (!token || !user) {
      console.log('No token or user available for WebSocket connection');
      return;
    }

    // Evitar múltiples conexiones
    if (ws && ws.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting, skipping...');
      return;
    }
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, skipping...');
      return;
    }

    try {
      // Close existing connection if any
      if (ws) {
        console.log('Closing existing WebSocket connection');
        ws.close();
      }

      const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        console.log('WebSocket URL:', wsUrl);
        console.log('User ID:', user.id);
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          
          if (data.type === 'notification' && data.notification) {
            console.log('🔔 Adding new notification:', data.notification);
            addNotification(data.notification);
          } else {
            console.log('⚠️ Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setWs(null);
        
        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectWebSocket();
          }, delay);
        }
      };

      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        console.error('WebSocket readyState:', websocket.readyState);
        setIsConnected(false);
      };

      setWs(websocket);
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };

  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (ws) {
      ws.close(1000, 'Manual disconnect');
      setWs(null);
    }
    setIsConnected(false);
  };

  const sendWebSocketMessage = (message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  };

  // WebSocket connection effect
  useEffect(() => {
    const token = getToken();
    if (user && token) {
      console.log('User authenticated, connecting WebSocket...');
      connectWebSocket();
    } else {
      console.log('User not authenticated, disconnecting WebSocket...');
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user]);

  // Initial data loading only
  useEffect(() => {
    // Cargar notificaciones iniciales solo una vez
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  // Listener para actualizar notificaciones cuando se crea una tarea
  useEffect(() => {
    const handleNotificationRefresh = () => {
      console.log('🔄 Refreshing notifications due to task creation/update');
      fetchNotifications();
      fetchUnreadCount();
    };

    window.addEventListener('notifications:refresh', handleNotificationRefresh);
    
    return () => {
      window.removeEventListener('notifications:refresh', handleNotificationRefresh);
    };
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    addNotification,
    markAllAsRead,
    fetchNotifications,
    fetchUnreadCount,
    sendWebSocketMessage,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
