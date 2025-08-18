'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import apiClient from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Torrent } from '@/types';

export interface SystemNotification {
  id: string;
  type: 'torrent_completed' | 'torrent_error' | 'connection_lost' | 'system_warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationContextValue {
  notifications: SystemNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [previousTorrents, setPreviousTorrents] = useState<Torrent[]>([]);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Only fetch data if authenticated and not loading
  const shouldFetchData = isAuthenticated && !authLoading;

  // Track torrent status changes to generate notifications
  const { data: torrents = [] } = useQuery(
    'notificationTorrents',
    () => {
      if (!shouldFetchData) {
        return Promise.reject(new Error('Not authenticated'));
      }
      return apiClient.getTorrents();
    },
    {
      enabled: shouldFetchData,
      refetchInterval: shouldFetchData ? 5000 : false, // Check for changes every 5 seconds
      onSuccess: (newTorrents: Torrent[]) => {
        if (previousTorrents.length > 0) {
          // Check for newly completed torrents
          newTorrents.forEach((newTorrent) => {
            const oldTorrent = previousTorrents.find(t => t.id === newTorrent.id);
            
            // Torrent just completed
            if (oldTorrent && 
                oldTorrent.status !== 'completed' && 
                newTorrent.status === 'completed' &&
                newTorrent.progress === 1) {
              addNotification({
                type: 'torrent_completed',
                title: 'Download Completed',
                message: `${newTorrent.name} has finished downloading`,
                data: { torrentId: newTorrent.id }
              });
            }
            
            // Torrent entered error state
            if (oldTorrent && 
                oldTorrent.status !== 'error' && 
                newTorrent.status === 'error') {
              addNotification({
                type: 'torrent_error',
                title: 'Torrent Error',
                message: `${newTorrent.name} encountered an error`,
                data: { torrentId: newTorrent.id }
              });
            }
          });
          
          // Check for new torrents
          const newTorrentIds = newTorrents.map(t => t.id);
          const oldTorrentIds = previousTorrents.map(t => t.id);
          const addedTorrents = newTorrents.filter(t => !oldTorrentIds.includes(t.id));
          
          addedTorrents.forEach((torrent) => {
            addNotification({
              type: 'system_warning',
              title: 'New Torrent Added',
              message: `${torrent.name} has been added to your downloads`,
              data: { torrentId: torrent.id }
            });
          });
        }
        setPreviousTorrents(newTorrents);
      },
      retry: (failureCount, error: any) => {
        // Don't retry authentication errors
        if (error?.response?.status === 401 || error?.response?.status === 403 || error?.message === 'Not authenticated') {
          return false;
        }
        return failureCount < 3;
      },
      onError: (error: any) => {
        // Silently handle authentication errors
        if (error?.response?.status === 401 || error?.response?.status === 403 || error?.message === 'Not authenticated') {
          return; // Don't show notification errors for auth issues
        }
        // Only add connection error notification for real API failures
        addNotification({
          type: 'connection_lost',
          title: 'Connection Error',
          message: 'Failed to connect to torrent server'
        });
      }
    }
  );

  const addNotification = useCallback((notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: SystemNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only last 50 notifications
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications
  }), [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearNotification, clearAllNotifications]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}
