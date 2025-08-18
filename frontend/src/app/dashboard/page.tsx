'use client';

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Button,
  Paper,
  Stack,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  CloudDownload,
  CloudUpload,
  Computer,
  Speed,
  TrendingUp,
  TrendingDown,
  PlayArrow,
  Pause,
  Stop,
  Add,
  Refresh,
  Delete,
  ErrorOutline,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import apiClient from '@/lib/api';
import { useRequireAuth } from '@/hooks/useAuth';
import { useRealTimeUptime } from '@/hooks/useRealTimeUptime';
import { useRealTimeTorrents, useRealTimeStats, useRealTimeTorrentStats } from '@/hooks/useRealTimeData';
import { formatBytes, formatSpeed, formatUptime } from '@/utils/formatters';
import { Torrent } from '@/types';
import ClientOnly from '@/components/ClientOnly';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'primary',
  subtitle,
  isLoading = false,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  subtitle?: string;
  isLoading?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {isLoading ? <CircularProgress size={24} /> : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

const TorrentRow = ({ torrent, onPause, onResume }: { 
  torrent: Torrent;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      p: 2,
      borderBottom: '1px solid',
      borderColor: 'divider',
      '&:hover': {
        backgroundColor: 'action.hover',
      },
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="subtitle2" noWrap fontWeight={500}>
        {torrent.name}
      </Typography>
      <Box display="flex" alignItems="center" gap={2} sx={{ mt: 1 }}>
        <Chip
          label={torrent.status}
          size="small"
          color={
            torrent.status === 'downloading' ? 'primary' :
            torrent.status === 'seeding' ? 'success' :
            torrent.status === 'checking' ? 'warning' :
            torrent.status === 'paused' ? 'default' : 'default'
          }
          sx={{ textTransform: 'capitalize' }}
        />
        <Typography variant="caption" color="text.secondary">
          {formatBytes(torrent.total_size)}
        </Typography>
        {torrent.download_speed > 0 && (
          <Typography variant="caption" color="primary">
            ↓ {formatSpeed(torrent.download_speed)}
          </Typography>
        )}
        {torrent.upload_speed > 0 && (
          <Typography variant="caption" color="success.main">
            ↑ {formatSpeed(torrent.upload_speed)}
          </Typography>
        )}
      </Box>
    </Box>
    <Box sx={{ width: 120, ml: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {Math.round(torrent.progress * 100)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={torrent.progress * 100}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
    <Box sx={{ ml: 2 }}>
      <IconButton 
        size="small" 
        onClick={() => {
          const torrentId = parseInt(torrent.id.toString(), 10);
          if (torrent.status === 'downloading' || torrent.status === 'seeding' || torrent.status === 'checking') {
            onPause(torrentId);
          } else if (torrent.status === 'paused') {
            onResume(torrentId);
          }
        }}
      >
        {(torrent.status === 'downloading' || torrent.status === 'seeding' || torrent.status === 'checking') ? <Pause /> : <PlayArrow />}
      </IconButton>
    </Box>
  </Box>
);

function DashboardPageContent() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Only fetch data if authenticated and not loading
  const shouldFetchData = isAuthenticated && !authLoading;
  
  // Cancel all queries immediately when authentication state changes
  React.useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      queryClient.cancelQueries();
    }
  }, [isAuthenticated, authLoading, queryClient]);
  
  // Fetch torrent statistics
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery(
    'torrentStats',
    () => {
      if (!shouldFetchData) {
        return Promise.reject(new Error('Not authenticated'));
      }
      return apiClient.getTorrentStats();
    },
    {
      enabled: shouldFetchData,
      refetchInterval: shouldFetchData ? 5000 : false, // Refresh every 5 seconds
      retry: (failureCount, error: any) => {
        // Don't retry authentication errors
        if (error?.response?.status === 401 || error?.response?.status === 403 || error?.message === 'Not authenticated') {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: (error: any) => {
        // Silently handle authentication errors
        if (error?.response?.status === 401 || error?.response?.status === 403 || error?.message === 'Not authenticated') {
          return;
        }
      },
    }
  );

  // Fetch session statistics
  const { data: sessionStats, isLoading: sessionLoading } = useQuery(
    'sessionStats',
    () => {
      if (!shouldFetchData) {
        return Promise.reject(new Error('Not authenticated'));
      }
      return apiClient.getSessionStats();
    },
    {
      enabled: shouldFetchData,
      refetchInterval: shouldFetchData ? 10000 : false, // Refresh every 10 seconds
      retry: (failureCount, error: any) => {
        // Don't retry authentication errors
        if (error?.response?.status === 401 || error?.response?.status === 403 || error?.message === 'Not authenticated') {
          return false;
        }
        return failureCount < 2;
      },
      onError: (error: any) => {
        // Silently handle authentication errors
        if (error?.response?.status === 401 || error?.response?.status === 403 || error?.message === 'Not authenticated') {
          return;
        }
      },
    }
  );

  // Fetch recent torrents (limit to 5 for dashboard)
  const { data: torrents = [], isLoading: torrentsLoading, refetch: refetchTorrents } = useQuery(
    'dashboardTorrents',
    () => {
      if (!shouldFetchData) {
        return Promise.reject(new Error('Not authenticated'));
      }
      return apiClient.getTorrents({ limit: 5 });
    },
    {
      enabled: shouldFetchData,
      refetchInterval: shouldFetchData ? 3000 : false, // Refresh every 3 seconds
      retry: (failureCount, error: any) => {
        // Don't retry authentication errors
        if (error?.response?.status === 401 || error?.response?.status === 403 || error?.message === 'Not authenticated') {
          return false;
        }
        return failureCount < 2;
      },
      onError: (error: any) => {
        // Silently handle authentication errors
        if (error?.response?.status === 401 || error?.response?.status === 403 || error?.message === 'Not authenticated') {
          return;
        }
      },
    }
  );
  
  // Real-time uptime calculation
  const realTimeUptime = useRealTimeUptime(
    sessionStats?.uptime,
    isAuthenticated && !sessionLoading && !!sessionStats?.uptime
  );
  
  // Real-time data hooks
  const realTimeTorrents = useRealTimeTorrents(
    torrents,
    isAuthenticated && !torrentsLoading
  );
  
  const realTimeSessionStats = useRealTimeStats(
    sessionStats,
    isAuthenticated && !sessionLoading
  );
  
  const realTimeTorrentStats = useRealTimeTorrentStats(
    realTimeTorrents,
    stats,
    isAuthenticated && !statsLoading
  );
  
  // Mutations for torrent actions (always define these hooks)
  const pauseTorrentMutation = useMutation(
    (id: number) => apiClient.pauseTorrent(id),
    {
      onSuccess: () => {
        toast.success('Torrent paused');
        queryClient.invalidateQueries('dashboardTorrents');
        queryClient.invalidateQueries('torrentStats');
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.detail || 'Failed to pause torrent';
        const displayMessage = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
        toast.error(displayMessage);
      },
    }
  );

  const resumeTorrentMutation = useMutation(
    (id: number) => apiClient.resumeTorrent(id),
    {
      onSuccess: () => {
        toast.success('Torrent resumed');
        queryClient.invalidateQueries('dashboardTorrents');
        queryClient.invalidateQueries('torrentStats');
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.detail || 'Failed to resume torrent';
        const displayMessage = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
        toast.error(displayMessage);
      },
    }
  );

  const bulkPauseAllMutation = useMutation(
    () => {
      const activeTorrents = realTimeTorrents
        .filter((t: Torrent) => t.status === 'downloading' || t.status === 'seeding')
        .map((t: Torrent) => t.id);
      return apiClient.bulkPauseTorrents(activeTorrents);
    },
    {
      onSuccess: (_, data) => {
        toast.success('All torrents paused');
        queryClient.invalidateQueries('dashboardTorrents');
        queryClient.invalidateQueries('torrentStats');
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.detail || 'Failed to pause all torrents';
        const displayMessage = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
        toast.error(displayMessage);
      },
    }
  );

  const bulkResumeAllMutation = useMutation(
    () => {
      const pausedTorrents = realTimeTorrents
        .filter((t: Torrent) => t.status === 'paused')
        .map((t: Torrent) => t.id);
      return apiClient.bulkResumeTorrents(pausedTorrents);
    },
    {
      onSuccess: () => {
        toast.success('All torrents resumed');
        queryClient.invalidateQueries('dashboardTorrents');
        queryClient.invalidateQueries('torrentStats');
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.detail || 'Failed to resume all torrents';
        const displayMessage = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
        toast.error(displayMessage);
      },
    }
  );

  const bulkDeleteAllMutation = useMutation(
    () => {
      const allTorrentIds = realTimeTorrents.map((t: Torrent) => t.id);
      if (allTorrentIds.length === 0) {
        return Promise.reject(new Error('No torrents to delete'));
      }
      return apiClient.bulkDeleteTorrents(allTorrentIds, true);
    },
    {
      onSuccess: () => {
        toast.success('All torrents deleted');
        queryClient.invalidateQueries('dashboardTorrents');
        queryClient.invalidateQueries('torrentStats');
        queryClient.invalidateQueries('torrents');
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to delete all torrents';
        const displayMessage = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
        toast.error(displayMessage);
      },
    }
  );
  
  // Show loading while checking auth
  if (authLoading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }
  
  // Don't render anything if not authenticated (will be redirected)
  if (!isAuthenticated) {
    return null;
  }

  const handleRefresh = () => {
    refetchStats();
    refetchTorrents();
    toast.success('Dashboard refreshed');
  };

  const handleAddTorrent = () => {
    router.push('/torrents?action=add');
  };

  const handleViewAllTorrents = () => {
    router.push('/torrents');
  };

  // Handle error states
  if (statsError && !statsLoading) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <ErrorOutline />
            Failed to load dashboard data: {(statsError as any)?.message || 'Unknown error'}
          </Box>
        </Alert>
        <Button onClick={handleRefresh} startIcon={<Refresh />} variant="contained">
          Retry
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <ClientOnly fallback={
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    }>
      <DashboardLayout>
        <Box sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back! Here's an overview of your torrent activity.
            </Typography>
          </Box>
        </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Torrents"
            value={realTimeTorrentStats?.total_torrents || 0}
            icon={<Computer />}
            subtitle={`${realTimeTorrentStats?.active_torrents || 0} active`}
            isLoading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Download Speed"
            value={formatSpeed(realTimeTorrentStats?.total_download_speed || 0)}
            icon={<CloudDownload />}
            color="primary"
            subtitle={`${realTimeTorrentStats?.downloading || 0} downloading`}
            isLoading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upload Speed"
            value={formatSpeed(realTimeTorrentStats?.total_upload_speed || 0)}
            icon={<CloudUpload />}
            color="success"
            subtitle={`${realTimeTorrentStats?.seeding || 0} seeding`}
            isLoading={statsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Downloaded"
            value={formatBytes(realTimeTorrentStats?.total_downloaded || 0)}
            icon={<TrendingUp />}
            color="secondary"
            subtitle={formatBytes(realTimeTorrentStats?.total_uploaded || 0) + ' uploaded'}
            isLoading={statsLoading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Torrents
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  size="small"
                  sx={{ textTransform: 'none' }}
                  onClick={handleAddTorrent}
                >
                  Add Torrent(s)
                </Button>
              </Box>
              <Box>
                {torrentsLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : realTimeTorrents.length > 0 ? (
                  realTimeTorrents.map((torrent: Torrent) => (
                    <TorrentRow 
                      key={torrent.id} 
                      torrent={torrent}
                      onPause={(id) => pauseTorrentMutation.mutate(id)}
                      onResume={(id) => resumeTorrentMutation.mutate(id)}
                    />
                  ))
                ) : (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body2" color="text.secondary">
                      No torrents found. Add your first torrent to get started!
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button variant="text" size="small" onClick={handleViewAllTorrents}>
                  View All Torrents
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Overview */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            {/* Connection Status */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Connection Status
                </Typography>
                <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      bgcolor: sessionStats ? 'success.main' : 'error.main', 
                      borderRadius: '50%' 
                    }} 
                  />
                  <Typography variant="body2">
                    {sessionStats ? 'Connected to DHT' : 'Connection status unknown'}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Port: {sessionStats?.port || 'Unknown'} • Peers: {sessionStats?.num_peers || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  DHT Nodes: {sessionStats?.dht_nodes || 0}
                </Typography>
                {sessionLoading && (
                  <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      Loading connection info...
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Quick Actions
                </Typography>
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    fullWidth
                    sx={{ textTransform: 'none' }}
                    onClick={handleAddTorrent}
                  >
                    Add Torrent(s)
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Pause />}
                    fullWidth
                    sx={{ textTransform: 'none' }}
                    onClick={() => bulkPauseAllMutation.mutate()}
                    disabled={bulkPauseAllMutation.isLoading || !realTimeTorrents.some((t: Torrent) => t.status === 'downloading' || t.status === 'seeding')}
                  >
                    {bulkPauseAllMutation.isLoading ? 'Pausing...' : 'Pause All'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrow />}
                    fullWidth
                    sx={{ textTransform: 'none' }}
                    onClick={() => bulkResumeAllMutation.mutate()}
                    disabled={bulkResumeAllMutation.isLoading || !realTimeTorrents.some((t: Torrent) => t.status === 'paused')}
                  >
                    {bulkResumeAllMutation.isLoading ? 'Resuming...' : 'Resume All'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Delete />}
                    fullWidth
                    sx={{ 
                      textTransform: 'none',
                      color: 'error.main',
                      borderColor: 'error.main',
                      '&:hover': {
                        borderColor: 'error.dark',
                        backgroundColor: 'error.dark',
                        color: 'error.contrastText',
                      }
                    }}
                    onClick={() => {
                      const confirmDelete = window.confirm(
                        `Are you sure you want to delete ALL ${realTimeTorrents.length} torrent${realTimeTorrents.length !== 1 ? 's' : ''} and their files? This action cannot be undone.`
                      );
                      if (confirmDelete) {
                        bulkDeleteAllMutation.mutate();
                      }
                    }}
                    disabled={bulkDeleteAllMutation.isLoading || realTimeTorrents.length === 0}
                  >
                    {bulkDeleteAllMutation.isLoading ? 'Deleting...' : 'Delete All'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* System Info */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  System Info
                </Typography>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    aTorrent v1.0.0
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    libtorrent v{sessionStats?.libtorrent_version || '2.0.9'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uptime: {realTimeUptime > 0 ? formatUptime(realTimeUptime) : (sessionStats?.uptime ? formatUptime(sessionStats.uptime) : 'Unknown')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
      </DashboardLayout>
    </ClientOnly>
  );
}

export default function DashboardPage() {
  return (
    <ClientOnly>
      <DashboardPageContent />
    </ClientOnly>
  );
}
