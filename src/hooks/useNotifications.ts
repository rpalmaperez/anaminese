'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, realtime } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  user_id: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Buscar notificações do usuário
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao buscar notificações:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter((n: Notification) => !n.read).length || 0);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return;
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        return;
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }, [user?.id]);

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Erro ao deletar notificação:', error);
        return;
      }

      // Atualizar estado local
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  }, [notifications]);

  // Configurar subscription para notificações em tempo real
  useEffect(() => {
    if (!user?.id) return;

    // Buscar notificações iniciais
    fetchNotifications();

    // Configurar subscription para novas notificações
    const subscription = realtime.subscribeToUserNotifications(
      user.id,
      (payload) => {
        console.log('Nova notificação recebida:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      }
    );

    return () => {
      realtime.unsubscribe(subscription);
    };
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications
  };
}

// Função helper para formatar tempo relativo
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Agora mesmo';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `Há ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `Há ${diffInMonths} mês${diffInMonths > 1 ? 'es' : ''}`;
}

// Função helper para obter ícone da notificação
export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'anamnese_expiring':
    case 'anamnese_expired':
      return '⏰';
    case 'new_student':
      return '👤';
    case 'system_update':
      return '🔄';
    case 'reminder':
      return '📝';
    default:
      return '📢';
  }
}

// Função helper para obter cor da notificação
export function getNotificationColor(type: string): string {
  switch (type) {
    case 'anamnese_expiring':
      return 'bg-yellow-500';
    case 'anamnese_expired':
      return 'bg-red-500';
    case 'new_student':
      return 'bg-blue-500';
    case 'system_update':
      return 'bg-green-500';
    case 'reminder':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
}