'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Toolbar,
  Stack,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Add,
  PlayArrow,
  Pause,
  Delete,
  Refresh,
  MoreVert,
  ViewList,
  ViewModule,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import apiClient from '@/lib/api';
import { useRequireAuth } from '@/hooks/useAuth';
import { 
  formatBytes, 
  formatSpeed, 
  formatETA, 
  getStatusColor 
} from '@/utils/formatters';
import ClientOnly from '@/components/ClientOnly';
import TorrentPreview from '@/components/TorrentPreview';
import parseTorrent from 'parse-torrent';

// Helper function to extract readable error messages
function getErrorMessage(error: any): string {
  // Check if error has response data
  const detail = error?.response?.data?.detail;
  
  if (!detail) {
    return error?.message || 'Unknown error';
  }
  
  // If detail is already a string, return it
  if (typeof detail === 'string') {
    return detail;
  }
  
  // If detail is an array (validation errors), format them
  if (Array.isArray(detail)) {
    return detail.map((err: any) => {
      if (typeof err === 'string') {
        return err;
      }
      // Handle Pydantic validation error format
      if (err.msg && err.loc) {
        const field = Array.isArray(err.loc) ? err.loc.join('.') : err.loc;
        return `${field}: ${err.msg}`;
      }
      // Fallback to stringifying the error
      return JSON.stringify(err);
    }).join(', ');
  }
  
  // If detail is an object, try to extract meaningful info
  if (typeof detail === 'object') {
    if (detail.msg) {
      return detail.msg;
    }
    // Fallback to stringifying the object
    return JSON.stringify(detail);
  }
  
  // Final fallback
  return 'Unknown error';
}
import { Torrent, TorrentCreate } from '@/types';

interface AddTorrentDialogProps {
  open: boolean;
  onClose: () => void;
}

function AddTorrentDialog({ open, onClose }: AddTorrentDialogProps) {
  const [autoStart, setAutoStart] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [fileContents, setFileContents] = useState<{[key: string]: string}>({});
  const [torrentInfos, setTorrentInfos] = useState<{[key: string]: any}>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTorrent, setSelectedTorrent] = useState<{info: any, fileName: string} | null>(null);
  const queryClient = useQueryClient();

  const addTorrentMutation = useMutation(
    (data: TorrentCreate) => apiClient.addTorrent(data),
    {
      onSuccess: () => {
        toast.success('Torrent added successfully');
        queryClient.invalidateQueries('torrents');
        handleClose();
      },
      onError: (error) => {
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg || 'Failed to add torrent');
      },
    }
  );

  const handleClose = () => {
    setAutoStart(true);
    setFiles([]);
    setFileContents({});
    setTorrentInfos({});
    setIsDragOver(false);
    setIsProcessing(false);
    setPreviewOpen(false);
    setSelectedTorrent(null);
    onClose();
  };

  const handleFileRead = useCallback(async (filesToRead: File[]) => {
    setIsProcessing(true);
    
    const newFiles: File[] = [];
    const newFileContents: {[key: string]: string} = {};
    
    try {
      for (const file of filesToRead) {
        if (!file.name.endsWith('.torrent')) {
          toast.error(`"${file.name}" is not a .torrent file`);
          continue;
        }
        
        // Check if file already exists
        if (files.some(f => f.name === file.name)) {
          toast.error(`"${file.name}" is already selected`);
          continue;
        }
        
        const reader = new FileReader();
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result;
            if (result) {
              resolve(result as ArrayBuffer);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsArrayBuffer(file);
        });
        
        // Convert to base64 for API
        const base64Content = btoa(
          new Uint8Array(arrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        // Parse torrent info for preview
        try {
          const torrentInfo = await parseTorrent(Buffer.from(arrayBuffer));
          newFileContents[file.name] = base64Content;
          setTorrentInfos(prev => ({ ...prev, [file.name]: torrentInfo }));
        } catch (parseError) {
          console.error('Error parsing torrent:', parseError);
          newFileContents[file.name] = base64Content;
        }
        
        newFiles.push(file);
      }
      
      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
        setFileContents(prev => ({ ...prev, ...newFileContents }));
        toast.success(
          newFiles.length === 1 
            ? `Torrent file "${newFiles[0].name}" loaded successfully`
            : `${newFiles.length} torrent files loaded successfully`
        );
      }
    } catch (error) {
      toast.error('Failed to read torrent files');
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      handleFileRead(selectedFiles);
    }
    // Reset input value so same files can be selected again
    event.target.value = '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileRead(droppedFiles);
    }
  }, [handleFileRead]);

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one torrent file');
      return;
    }

    // If only one file, submit immediately
    if (files.length === 1) {
      const file = files[0];
      const fileContent = fileContents[file.name];
      
      if (!fileContent) {
        toast.error('File content not available');
        return;
      }

      const requestData = {
        torrent_file: fileContent,
        auto_start: autoStart,
        sequential_download: false,
        priority: 1,
      };
      
      addTorrentMutation.mutate(requestData);
      return;
    }

    // For multiple files, submit them sequentially
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileContent = fileContents[file.name];
      
      if (!fileContent) {
        toast.error(`File content not available for ${file.name}`);
        errorCount++;
        continue;
      }

      try {
        const requestData = {
          torrent_file: fileContent,
          auto_start: autoStart,
          sequential_download: false,
          priority: 1,
        };
        
        await apiClient.addTorrent(requestData);
        successCount++;
        
        // Show progress toast for multiple files
        if (files.length > 1) {
          toast.success(`Added torrent ${i + 1}/${files.length}: ${file.name}`);
        }
      } catch (error) {
        const errorMsg = getErrorMessage(error);
        toast.error(`Failed to add ${file.name}: ${errorMsg}`);
        errorCount++;
      }
    }

    // Show summary toast
    if (successCount > 0 && errorCount === 0) {
      toast.success(`Successfully added ${successCount} torrent${successCount > 1 ? 's' : ''}`);
    } else if (successCount > 0 && errorCount > 0) {
      toast.success(`Added ${successCount} torrent${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    } else if (errorCount > 0) {
      toast.error(`Failed to add all ${errorCount} torrent${errorCount > 1 ? 's' : ''}`);
    }

    // Refresh the torrents list and close dialog
    queryClient.invalidateQueries('torrents');
    handleClose();
  };
  return (
    <React.Fragment>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add New Torrent(s)</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              mb: 3,
              textAlign: 'center',
              bgcolor: isDragOver ? 'action.hover' : 'background.paper',
              border: isDragOver ? '2px dashed' : '2px dashed',
              borderColor: isDragOver ? 'primary.main' : 'divider',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={(e) => {
              // Only trigger file input if clicking on the Paper itself, not on child elements
              if (e.target === e.currentTarget || 
                  e.currentTarget.contains(e.target as Node) && 
                  !(e.target as HTMLElement).closest('.MuiChip-root')) {
                document.getElementById('torrent-file-input')?.click();
              }
            }}
          >
            <input
              id="torrent-file-input"
              type="file"
              accept=".torrent"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            {isProcessing ? (
              <Box>
                <CircularProgress size={24} sx={{ mb: 1 }} />
                <Typography variant="h6" gutterBottom>
                  Processing files...
                </Typography>
              </Box>
            ) : files.length > 0 ? (
              <Box>
                <Typography variant="h6" color="primary" gutterBottom>
                  ✓ {files.length} file{files.length > 1 ? 's' : ''} selected
                </Typography>
                <Box sx={{ mt: 1, maxHeight: 120, overflow: 'auto' }}>
                  {files.map((file, index) => (
                    <Tooltip
                      key={index}
                      title={torrentInfos[file.name] ? `Click to preview • Size: ${formatBytes(torrentInfos[file.name].length || 0)}` : 'Click to preview'}
                      placement="top"
                    >
                      <Chip
                        label={file.name}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent parent Paper's onClick from firing
                          if (torrentInfos[file.name]) {
                            setSelectedTorrent({ info: torrentInfos[file.name], fileName: file.name });
                            setPreviewOpen(true);
                          } else {
                            toast('Torrent info is still being processed...', { icon: 'ℹ️' });
                          }
                        }}
                        onDelete={(e) => {
                          e.stopPropagation(); // Prevent parent Paper's onClick from firing
                          setFiles(prev => prev.filter((_, i) => i !== index));
                          setFileContents(prev => {
                            const newContents = { ...prev };
                            delete newContents[file.name];
                            return newContents;
                          });
                          setTorrentInfos(prev => {
                            const newInfos = { ...prev };
                            delete newInfos[file.name];
                            return newInfos;
                          });
                        }}
                        size="small"
                        sx={{ 
                          m: 0.5,
                          cursor: torrentInfos[file.name] ? 'pointer' : 'default',
                          '&:hover': torrentInfos[file.name] ? {
                            backgroundColor: 'action.hover',
                            transform: 'scale(1.05)',
                          } : {},
                          transition: 'all 0.2s ease-in-out',
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Click to add more files or drag & drop additional torrents.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {isDragOver ? 'Drop your torrent files here' : 'Drag & Drop or Click to Select'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Select one or more .torrent files from your computer
                </Typography>
              </Box>
            )}
          </Paper>
          
          <FormControlLabel
            control={
              <Switch
                checked={autoStart}
                onChange={(e) => setAutoStart(e.target.checked)}
              />
            }
            label="Start download automatically"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={files.length === 0 || isProcessing}
        >
          {isProcessing ? 'Processing...' : 
           files.length === 0 ? 'Add Torrent(s)' :
           files.length === 1 ? 'Add Torrent(s)' :
           `Add ${files.length} Torrent(s)`}
          </Button>
        </DialogActions>
      </Dialog>
      <TorrentPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        torrentInfo={selectedTorrent?.info || null}
        fileName={selectedTorrent?.fileName || ''}
      />
    </React.Fragment>
  );
}

// Content component that uses all hooks consistently
function TorrentsPageContent() {
  // Require authentication - this will redirect to login if not authenticated
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const queryClient = useQueryClient();
  
  // Check for 'action=add' query parameter to auto-open Add Torrent dialog
  React.useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setAddDialogOpen(true);
      // Clean up URL by removing the query parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Only fetch data if authenticated and not loading
  const shouldFetchData = isAuthenticated && !authLoading;
  
  // Fetch torrents using React Query with improved real-time updates
  const { data: torrents = [], isLoading, error, refetch } = useQuery(
    ['torrents', statusFilter],
    () => {
      if (!shouldFetchData) {
        return Promise.reject(new Error('Not authenticated'));
      }
      const filters = statusFilter !== 'all' ? { status: statusFilter } : {};
      return apiClient.getTorrents(filters);
    },
    {
      enabled: shouldFetchData,
      refetchInterval: shouldFetchData ? 1000 : false, // Faster 1-second updates
      refetchIntervalInBackground: true, // Continue polling when tab is not focused
      refetchOnWindowFocus: shouldFetchData, // Only refresh when authenticated
      refetchOnReconnect: shouldFetchData, // Only refresh when authenticated
      staleTime: 0, // Always consider data stale for real-time updates
      cacheTime: 30000, // Keep in cache for 30 seconds
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
          return; // Don't log or show these errors
        }
      },
    }
  );

  // Mutations for torrent actions - MOVED BEFORE EARLY RETURNS
  const pauseTorrentMutation = useMutation(
    (id: number) => apiClient.pauseTorrent(id),
    {
      onSuccess: () => {
        toast.success('Torrent paused');
        queryClient.invalidateQueries('torrents');
      },
      onError: (error: any) => {
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg || 'Failed to pause torrent');
      },
    }
  );

  const resumeTorrentMutation = useMutation(
    (id: number) => apiClient.resumeTorrent(id),
    {
      onSuccess: () => {
        toast.success('Torrent resumed');
        queryClient.invalidateQueries('torrents');
      },
      onError: (error: any) => {
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg || 'Failed to resume torrent');
      },
    }
  );

  const deleteTorrentMutation = useMutation(
    ({ id, deleteFiles }: { id: number; deleteFiles: boolean }) =>
      apiClient.deleteTorrent(id, deleteFiles),
    {
      // Optimistic update - remove from UI immediately
      onMutate: async ({ id }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries('torrents');
        
        // Snapshot the previous value
        const previousTorrents = queryClient.getQueryData(['torrents', statusFilter]);
        
        // Optimistically update to remove the torrent
        queryClient.setQueryData(['torrents', statusFilter], (old: any[] | undefined) => {
          return old?.filter(torrent => torrent.id !== id) || [];
        });
        
        // Return a context object with the snapshotted value
        return { previousTorrents };
      },
      onSuccess: (_, variables) => {
        toast.success('Torrent deleted successfully');
        // Force immediate refresh to ensure data is up to date
        queryClient.invalidateQueries('torrents');
        queryClient.invalidateQueries('torrentStats');
        queryClient.invalidateQueries('dashboardTorrents');
        // Force immediate refetch
        refetch();
      },
      onError: (error: any, variables, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousTorrents) {
          queryClient.setQueryData(['torrents', statusFilter], context.previousTorrents);
        }
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg || 'Failed to delete torrent');
      },
      // Always refetch after mutation, either success or failure
      onSettled: () => {
        queryClient.invalidateQueries('torrents');
      },
    }
  );

  // Bulk operations
  const bulkPauseMutation = useMutation(
    (ids: number[]) => apiClient.bulkPauseTorrents(ids),
    {
      onSuccess: (_, ids) => {
        toast.success(`Paused ${ids.length} torrent${ids.length > 1 ? 's' : ''}`);
        queryClient.invalidateQueries('torrents');
        queryClient.invalidateQueries('torrentStats');
        setSelectedRows([]);
      },
      onError: (error: any) => {
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg || 'Failed to pause torrents');
      },
    }
  );

  const bulkResumeMutation = useMutation(
    (ids: number[]) => apiClient.bulkResumeTorrents(ids),
    {
      onSuccess: (_, ids) => {
        toast.success(`Resumed ${ids.length} torrent${ids.length > 1 ? 's' : ''}`);
        queryClient.invalidateQueries('torrents');
        queryClient.invalidateQueries('torrentStats');
        setSelectedRows([]);
      },
      onError: (error: any) => {
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg || 'Failed to resume torrents');
      },
    }
  );

  const bulkDeleteMutation = useMutation(
    ({ ids, deleteFiles }: { ids: number[]; deleteFiles: boolean }) =>
      apiClient.bulkDeleteTorrents(ids, deleteFiles),
    {
      // Optimistic update - remove from UI immediately
      onMutate: async ({ ids }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries('torrents');
        
        // Snapshot the previous value
        const previousTorrents = queryClient.getQueryData(['torrents', statusFilter]);
        
        // Optimistically update to remove the torrents
        queryClient.setQueryData(['torrents', statusFilter], (old: any[] | undefined) => {
          return old?.filter(torrent => !ids.includes(torrent.id)) || [];
        });
        
        // Return a context object with the snapshotted value
        return { previousTorrents };
      },
      onSuccess: (_, { ids }) => {
        toast.success(`Deleted ${ids.length} torrent${ids.length > 1 ? 's' : ''} successfully`);
        queryClient.invalidateQueries('torrents');
        queryClient.invalidateQueries('torrentStats');
        queryClient.invalidateQueries('dashboardTorrents');
        setSelectedRows([]);
        // Force immediate refetch
        refetch();
      },
      onError: (error: any, variables, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousTorrents) {
          queryClient.setQueryData(['torrents', statusFilter], context.previousTorrents);
        }
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg || 'Failed to delete torrents');
      },
      // Always refetch after mutation, either success or failure
      onSettled: () => {
        queryClient.invalidateQueries('torrents');
      },
    }
  );

  const columns: GridColDef[] = [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <Tooltip title={(params.row.status === 'downloading' || params.row.status === 'seeding') ? 'Pause' : 'Resume'}>
            <IconButton
              size="small"
              onClick={() => {
                const torrentId = parseInt(params.row.id, 10);
                if (isNaN(torrentId)) {
                  toast.error('Invalid torrent ID');
                  return;
                }
                if (params.row.status === 'downloading' || params.row.status === 'seeding') {
                  pauseTorrentMutation.mutate(torrentId);
                } else {
                  resumeTorrentMutation.mutate(torrentId);
                }
              }}
            >
              {(params.row.status === 'downloading' || params.row.status === 'seeding') ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => {
                const confirmDelete = window.confirm('Are you sure you want to delete this torrent?');
                if (confirmDelete) {
                  const torrentId = parseInt(params.row.id, 10);
                  if (isNaN(torrentId)) {
                    toast.error('Invalid torrent ID');
                    return;
                  }
                  deleteTorrentMutation.mutate({ id: torrentId, deleteFiles: true });
                }
              }}
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 300,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="subtitle2" noWrap fontWeight={500}>
            {params.value}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} sx={{ mt: 0.5 }}>
            {params.row.label && (
              <Chip
                label={params.row.label}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 18 }}
              />
            )}
            <Typography variant="caption" color="text.secondary">
              {formatBytes(params.row.downloaded)} / {formatBytes(params.row.total_size)}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getStatusColor(params.value)}
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'progress',
      headerName: 'Progress',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="caption">
              {Math.round(params.value * 100)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={params.value * 100}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      ),
    },
    {
      field: 'download_speed',
      headerName: 'Down Speed',
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2" color={params.value > 0 ? 'primary.main' : 'text.secondary'}>
          {params.value > 0 ? formatSpeed(params.value) : '—'}
        </Typography>
      ),
    },
    {
      field: 'upload_speed',
      headerName: 'Up Speed',
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2" color={params.value > 0 ? 'success.main' : 'text.secondary'}>
          {params.value > 0 ? formatSpeed(params.value) : '—'}
        </Typography>
      ),
    },
    {
      field: 'eta',
      headerName: 'ETA',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.row.status === 'downloading' ? formatETA(params.value) : '—'}
        </Typography>
      ),
    },
    {
      field: 'ratio',
      headerName: 'Ratio',
      width: 80,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value.toFixed(2)}
        </Typography>
      ),
    },
  ];

  const filteredTorrents = useMemo(() => {
    if (!torrents) return [];
    if (statusFilter === 'all') return torrents;
    return torrents.filter((t: Torrent) => t.status === statusFilter);
  }, [torrents, statusFilter]);

  const statusCounts = useMemo(() => {
    if (!torrents) return {};
    return torrents.reduce((acc: any, torrent: Torrent) => {
      acc[torrent.status] = (acc[torrent.status] || 0) + 1;
      return acc;
    }, {});
  }, [torrents]);

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

  // Handle error state
  if (error) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load torrents: {(error as any)?.message || 'Unknown error'}
        </Alert>
        <Button onClick={() => refetch()} startIcon={<Refresh />}>
          Retry
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Torrents
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your torrent downloads and uploads
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
            sx={{ textTransform: 'none' }}
          >
            Add Torrent(s)
          </Button>
        </Box>
      </Box>

      {/* Toolbar */}
      <Card sx={{ mb: 3 }}>
        <Toolbar sx={{ gap: 1, justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1}>
            {/* Status Filter Pills */}
            <Stack direction="row" spacing={1}>
              {[
                { key: 'all', label: 'All', count: torrents?.length || 0 },
                { key: 'downloading', label: 'Downloading', count: statusCounts.downloading || 0 },
                { key: 'seeding', label: 'Seeding', count: statusCounts.seeding || 0 },
                { key: 'paused', label: 'Paused', count: statusCounts.paused || 0 },
                { key: 'completed', label: 'Completed', count: statusCounts.completed || 0 },
                { key: 'checking', label: 'Checking', count: statusCounts.checking || 0 },
              ].map((filter) => (
                <Chip
                  key={filter.key}
                  label={`${filter.label} (${filter.count})`}
                  variant={statusFilter === filter.key ? 'filled' : 'outlined'}
                  color={statusFilter === filter.key ? 'primary' : 'default'}
                  onClick={() => setStatusFilter(filter.key)}
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
              ))}
            </Stack>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <IconButton onClick={() => refetch()}>
              <Refresh />
            </IconButton>
            <IconButton
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            >
              {viewMode === 'list' ? <ViewModule /> : <ViewList />}
            </IconButton>
          </Box>
        </Toolbar>
      </Card>

      {/* Bulk Actions Toolbar - shown when torrents are selected */}
      {selectedRows.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Toolbar>
            <Typography variant="h6" sx={{ flex: 1 }}>
              {selectedRows.length} torrent{selectedRows.length > 1 ? 's' : ''} selected
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                color="inherit"
                startIcon={<PlayArrow />}
                onClick={() => {
                  const ids = selectedRows.map(id => parseInt(id as string, 10)).filter(id => !isNaN(id));
                  if (ids.length === 0) {
                    toast.error('No valid torrent IDs selected');
                    return;
                  }
                  bulkResumeMutation.mutate(ids);
                }}
                disabled={bulkResumeMutation.isLoading}
                size="small"
              >
                Resume
              </Button>
              <Button
                color="inherit"
                startIcon={<Pause />}
                onClick={() => {
                  const ids = selectedRows.map(id => parseInt(id as string, 10)).filter(id => !isNaN(id));
                  if (ids.length === 0) {
                    toast.error('No valid torrent IDs selected');
                    return;
                  }
                  bulkPauseMutation.mutate(ids);
                }}
                disabled={bulkPauseMutation.isLoading}
                size="small"
              >
                Pause
              </Button>
              <Button
                color="inherit"
                startIcon={<Delete />}
                onClick={() => {
                  const confirmDelete = window.confirm(
                    `Are you sure you want to delete ${selectedRows.length} torrent${selectedRows.length > 1 ? 's' : ''}?`
                  );
                  if (confirmDelete) {
                    const ids = selectedRows.map(id => parseInt(id as string, 10)).filter(id => !isNaN(id));
                    if (ids.length === 0) {
                      toast.error('No valid torrent IDs selected');
                      return;
                    }
                    bulkDeleteMutation.mutate({ ids, deleteFiles: true });
                  }
                }}
                disabled={bulkDeleteMutation.isLoading}
                size="small"
              >
                Delete
              </Button>
              <Button
                color="inherit"
                onClick={() => setSelectedRows([])}
                size="small"
              >
                Clear
              </Button>
            </Stack>
          </Toolbar>
        </Card>
      )}

      {/* Torrents Table */}
      <Card>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredTorrents}
            columns={columns}
            loading={isLoading}
            checkboxSelection
            onRowSelectionModelChange={setSelectedRows}
            rowSelectionModel={selectedRows}
            disableRowSelectionOnClick
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
              },
            }}
          />
        </Box>
      </Card>

      <AddTorrentDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />
    </DashboardLayout>
  );
}

export default function TorrentsPage() {
  return (
    <ClientOnly>
      <TorrentsPageContent />
    </ClientOnly>
  );
}
