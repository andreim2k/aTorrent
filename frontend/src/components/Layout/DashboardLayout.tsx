'use client';

import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Badge,
  Chip,
  Popover,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  CloudDownload,
  Settings,
  Analytics,
  Logout,
  Add,
  Notifications,
  Lock,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationPanel from '@/components/NotificationPanel';

const drawerWidth = 280;

const navigationItems = [
  { 
    label: 'Dashboard', 
    path: '/dashboard', 
    icon: <Dashboard />,
    description: 'Overview and statistics'
  },
  { 
    label: 'Torrents', 
    path: '/torrents', 
    icon: <CloudDownload />,
    description: 'Manage your torrents'
  },
  { 
    label: 'Statistics', 
    path: '/statistics', 
    icon: <Analytics />,
    description: 'Detailed analytics'
  },
  { 
    label: 'Settings', 
    path: '/settings', 
    icon: <Settings />,
    description: 'Application settings'
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { unreadCount } = useNotifications();
  

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const NavigationContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo and App Title */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
          aTorrent
        </Typography>
        <Typography variant="caption" color="text.secondary">
          a Modern Torrent Client
        </Typography>
      </Box>

      <Divider />

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ px: 2, py: 1 }}>
          {navigationItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => {
                    router.push(item.path);
                    if (isMobile) setMobileDrawerOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                    },
                    py: 1.5,
                    px: 2,
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: isActive ? 'inherit' : 'text.secondary',
                      minWidth: 40
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    secondary={!isActive ? item.description : undefined}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.95rem'
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      sx: { mt: 0.5 }
                    }}
                  />
                  {item.label === 'Torrents' && (
                    <Badge badgeContent={0} color="secondary" />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          {/* Notifications */}
          <IconButton sx={{ mr: 1 }} onClick={handleNotificationOpen}>
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Access Menu */}
          <IconButton onClick={handleUserMenuOpen}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: 'primary.main'
              }}
            >
              <Lock />
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={() => { handleUserMenuClose(); router.push('/settings'); }}>
              <ListItemIcon><Settings /></ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><Logout /></ListItemIcon>
              <ListItemText>Lock Access</ListItemText>
            </MenuItem>
          </Menu>

          {/* Notification Popover */}
          <Popover
            open={Boolean(notificationAnchor)}
            anchorEl={notificationAnchor}
            onClose={handleNotificationClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{ mt: 1 }}
          >
            <NotificationPanel onClose={handleNotificationClose} />
          </Popover>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: 'background.default',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <NavigationContent />
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: 'background.default',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          <NavigationContent />
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: 'background.default',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar /> {/* Spacing for AppBar */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardLayoutContent>
      {children}
    </DashboardLayoutContent>
  );
}
