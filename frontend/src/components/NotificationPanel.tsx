'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  WifiOff,
  Clear,
  MarkEmailRead,
  DeleteSweep,
} from '@mui/icons-material';
import { useNotifications, SystemNotification } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const getNotificationIcon = (type: SystemNotification['type']) => {
  switch (type) {
    case 'torrent_completed':
      return <CheckCircle sx={{ color: 'success.main' }} />;
    case 'torrent_error':
      return <Error sx={{ color: 'error.main' }} />;
    case 'connection_lost':
      return <WifiOff sx={{ color: 'warning.main' }} />;
    case 'system_warning':
      return <Warning sx={{ color: 'info.main' }} />;
    default:
      return <Warning sx={{ color: 'grey.500' }} />;
  }
};

const getNotificationColor = (type: SystemNotification['type']) => {
  switch (type) {
    case 'torrent_completed':
      return 'success';
    case 'torrent_error':
      return 'error';
    case 'connection_lost':
      return 'warning';
    case 'system_warning':
      return 'info';
    default:
      return 'default';
  }
};

interface NotificationPanelProps {
  onClose?: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  } = useNotifications();

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleClearNotification = (id: string) => {
    clearNotification(id);
  };

  return (
    <Paper
      elevation={8}
      sx={{
        width: 400,
        maxHeight: 600,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Notifications
          {unreadCount > 0 && (
            <Chip
              label={unreadCount}
              size="small"
              color="error"
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        {onClose && (
          <IconButton size="small" onClick={onClose}>
            <Clear />
          </IconButton>
        )}
      </Box>

      {/* Actions */}
      {notifications.length > 0 && (
        <Box
          sx={{
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
          }}
        >
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<MarkEmailRead />}
              onClick={markAllAsRead}
            >
              Mark All Read
            </Button>
          )}
          <Button
            size="small"
            startIcon={<DeleteSweep />}
            onClick={clearAllNotifications}
            color="error"
          >
            Clear All
          </Button>
        </Box>
      )}

      {/* Notification List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {notifications.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    alignItems: 'flex-start',
                    backgroundColor: notification.read 
                      ? 'transparent' 
                      : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  <ListItemIcon sx={{ mt: 1 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight={notification.read ? 400 : 600}
                        >
                          {notification.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {!notification.read && (
                            <IconButton
                              size="small"
                              onClick={() => handleMarkAsRead(notification.id)}
                              title="Mark as read"
                            >
                              <MarkEmailRead fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleClearNotification(notification.id)}
                            title="Clear notification"
                          >
                            <Clear fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                        >
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}
