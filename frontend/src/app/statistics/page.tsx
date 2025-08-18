'use client';

import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  CloudDownload,
  CloudUpload,
  Computer,
  AccessTime,
  Speed,
  Storage,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useRequireAuth } from '@/hooks/useAuth';
import { useRealTimeStats, useRealTimeTorrentStats } from '@/hooks/useRealTimeData';
import apiClient from '@/lib/api';
import { formatBytes, formatSpeed } from '@/utils/formatters';
import ClientOnly from '@/components/ClientOnly';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  isLoading?: boolean;
}

const StatCard = ({ title, value, subtitle, icon, color = 'primary', isLoading = false }: StatCardProps) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          {isLoading ? (
            <Box sx={{ py: 1 }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
          )}
          {subtitle && !isLoading && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            backgroundColor: `${color}.main`,
            color: `${color}.contrastText`,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

function StatisticsPageContent() {
  // Require authentication - this will redirect to login if not authenticated
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  
  // Load real statistics from API
  const { data: overviewStats, isLoading: overviewLoading, error: overviewError } = useQuery(
    'torrentStatsOverview',
    () => apiClient.getTorrentStats(),
    {
      enabled: isAuthenticated,
      refetchInterval: 10000, // Refresh every 10 seconds
      staleTime: 5000,
      retry: 3,
      retryDelay: 1000,
    }
  );
  
  const { data: sessionStats, isLoading: sessionLoading, error: sessionError } = useQuery(
    'torrentStatsSession', 
    () => apiClient.getSessionStats(),
    {
      enabled: isAuthenticated,
      refetchInterval: 5000, // Refresh every 5 seconds
      staleTime: 2000,
      retry: 3,
      retryDelay: 1000,
    }
  );
  
  // Real-time data hooks
  const realTimeSessionStats = useRealTimeStats(
    sessionStats,
    isAuthenticated && !sessionLoading
  );
  
  const realTimeOverviewStats = useRealTimeTorrentStats(
    undefined, // We don't have individual torrents here
    overviewStats,
    isAuthenticated && !overviewLoading
  );
  
  const isLoading = overviewLoading || sessionLoading;
  const hasErrors = !!overviewError || !!sessionError;
  
  // Calculate ratios safely
  const calculateRatio = (uploaded: number, downloaded: number) => {
    return downloaded > 0 ? uploaded / downloaded : 0;
  };
  
  // Track maximum historical speeds for adaptive progress bars
  const [maxHistoricalDownload, setMaxHistoricalDownload] = React.useState(1024 * 1024); // Start with 1 MB/s minimum
  const [maxHistoricalUpload, setMaxHistoricalUpload] = React.useState(512 * 1024);     // Start with 512 KB/s minimum
  
  // Update historical maximums when new data arrives
  React.useEffect(() => {
    if (sessionStats) {
      const currentDownload = sessionStats.download_rate || 0;
      const currentUpload = sessionStats.upload_rate || 0;
      
      if (currentDownload > maxHistoricalDownload) {
        setMaxHistoricalDownload(currentDownload);
      }
      
      if (currentUpload > maxHistoricalUpload) {
        setMaxHistoricalUpload(currentUpload);
      }
    }
  }, [sessionStats, maxHistoricalDownload, maxHistoricalUpload]);
  
  const calculateSpeedPercentage = (currentSpeed: number, maxSpeed: number) => {
    if (currentSpeed <= 0) return 2; // Show minimal bar when idle
    const percentage = (currentSpeed / maxSpeed) * 100;
    return Math.min(Math.max(percentage, 5), 100); // Keep between 5-100%
  };
  
  // Format time from seconds to human readable
  const formatTime = (seconds: number) => {
    if (!seconds || seconds < 60) return `${Math.floor(seconds)}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

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
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography>Redirecting to login...</Typography>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Statistics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time analytics and performance metrics for your torrent activity
        </Typography>
      </Box>

      {hasErrors && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Unable to load some statistics. Check if the backend is running.
        </Alert>
      )}

      {/* Torrent Overview Statistics */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
        Torrent Overview
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Torrents"
            value={overviewStats?.total_torrents || 0}
            icon={<Computer />}
            color="primary"
            isLoading={overviewLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Torrents"
            value={overviewStats?.active_torrents || 0}
            subtitle={`${overviewStats?.downloading || 0} downloading, ${overviewStats?.seeding || 0} seeding`}
            icon={<TrendingUp />}
            color="success"
            isLoading={overviewLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Paused Torrents"
            value={overviewStats?.paused || 0}
            icon={<CloudDownload />}
            color="secondary"
            isLoading={overviewLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Torrents"
            value={overviewStats?.completed || 0}
            icon={<CloudUpload />}
            color="primary"
            isLoading={overviewLoading}
          />
        </Grid>
      </Grid>

      {/* Current Session Statistics */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
        Current Session
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Download Rate"
            value={sessionStats ? formatSpeed(sessionStats.download_rate || 0) : '0 B/s'}
            icon={<CloudDownload />}
            color="primary"
            isLoading={sessionLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Upload Rate"
            value={sessionStats ? formatSpeed(sessionStats.upload_rate || 0) : '0 B/s'}
            icon={<CloudUpload />}
            color="success"
            isLoading={sessionLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Connected Peers"
            value={sessionStats?.num_peers || 0}
            subtitle={`Port: ${sessionStats?.port || 0}`}
            icon={<Computer />}
            color="secondary"
            isLoading={sessionLoading}
          />
        </Grid>
      </Grid>

      {/* System Information */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
        System Information
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                <Speed color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Current Transfer Rates
                </Typography>
              </Box>
              {sessionLoading ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={24} />
                </Box>
              ) : sessionError ? (
                <Box py={3}>
                  <Typography variant="body2" color="error" textAlign="center">
                    Error loading transfer rates
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Download Rate
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formatSpeed(sessionStats?.download_rate || 0)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={calculateSpeedPercentage(sessionStats?.download_rate || 0, maxHistoricalDownload)}
                      sx={{ height: 6, borderRadius: 3 }}
                      color="primary"
                    />
                  </Box>
                  <Box>
                    <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Upload Rate
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formatSpeed(sessionStats?.upload_rate || 0)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={calculateSpeedPercentage(sessionStats?.upload_rate || 0, maxHistoricalUpload)}
                      sx={{ height: 6, borderRadius: 3 }}
                      color="success"
                    />
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                <Storage color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Session Details
                </Typography>
              </Box>
              {sessionLoading ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={24} />
                </Box>
              ) : sessionError ? (
                <Box py={3}>
                  <Typography variant="body2" color="error" textAlign="center">
                    Error loading session details
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">DHT Nodes:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {sessionStats?.dht_nodes || 0}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">LibTorrent Version:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {sessionStats?.libtorrent_version || 'Unknown'}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Listen Port:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {sessionStats?.port || 'Not listening'}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}

export default function StatisticsPage() {
  return (
    <ClientOnly>
      <StatisticsPageContent />
    </ClientOnly>
  );
}
