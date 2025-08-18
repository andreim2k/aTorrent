'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Lock,
  FolderOpen,
  Visibility,
  VisibilityOff,
  Settings,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth, useRequireAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api';
import ClientOnly from '@/components/ClientOnly';
import { AppSettings } from '@/types';

// Helper function to extract readable error messages
function getErrorMessage(error: any): string {
  // Check if error has response data
  const detail = error?.response?.data?.detail;
  const status = error?.response?.status;
  
  if (!detail) {
    if (status === 401) {
      return 'Authentication failed. Please check your credentials.';
    }
    if (status === 403) {
      return 'Access forbidden. You do not have permission to perform this action.';
    }
    if (status === 404) {
      return 'Resource not found.';
    }
    if (status === 500) {
      return 'Server error. Please try again later.';
    }
    return error?.message || 'Unknown error';
  }
  
  // If detail is already a string, return it with context improvements
  if (typeof detail === 'string') {
    // Improve specific error messages
    if (detail === 'Not Found') {
      return 'User not found or invalid credentials';
    }
    if (detail.toLowerCase().includes('current password')) {
      return 'Current password is incorrect. Please try again.';
    }
    if (detail.toLowerCase().includes('password') && detail.toLowerCase().includes('match')) {
      return 'New passwords do not match. Please ensure both password fields are identical.';
    }
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
        const fieldName = field.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        
        // Improve field-specific error messages
        if (err.msg.includes('at least') && err.msg.includes('characters')) {
          return `${fieldName} must be at least ${err.msg.match(/\d+/)?.[0] || 6} characters long`;
        }
        if (err.msg.includes('do not match')) {
          return 'Passwords do not match. Please ensure both password fields are identical.';
        }
        
        return `${fieldName}: ${err.msg}`;
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

// Password change form data
interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}


// Get dynamic default download path based on OS
const getDefaultDownloadPath = (): string => {
  if (typeof window === 'undefined') {
    // Server-side fallback - let backend determine the path
    return '';
  }
  
  // Client-side: Since we can't access environment variables in browser,
  // return an empty string and let the backend provide the actual dynamic path
  // The real path will be loaded from the API when the component mounts
  return '';
};

const defaultAppSettings: Partial<AppSettings> = {
  default_download_path: getDefaultDownloadPath(),
};

const SettingsPageContent = React.memo(function SettingsPageContent() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  
  // Only use state for UI elements that need to cause re-renders
  const [uiState, setUiState] = useState({
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    localDownloadPath: '',
    isPathDirty: false,
  });
  const downloadPathRef = useRef<HTMLInputElement>(null);
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmNewPasswordRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();


  // Load admin settings - Always call hooks at the top level
  const { data: appSettings = defaultAppSettings, isLoading: settingsLoading } = useQuery(
    'settings',
    () => apiClient.getSettings(),
    {
      enabled: isAuthenticated,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Initialize local download path when settings are loaded
  useEffect(() => {
    if (appSettings?.default_download_path && !uiState.isPathDirty) {
      // Only update if the local path is empty or different from server data
      if (!uiState.localDownloadPath || uiState.localDownloadPath !== appSettings.default_download_path) {
        setUiState(prev => ({ 
          ...prev, 
          localDownloadPath: appSettings.default_download_path,
          isPathDirty: false // Explicitly mark as not dirty when syncing with server
        }));
      }
    }
  }, [appSettings?.default_download_path, uiState.isPathDirty, uiState.localDownloadPath]);

  // Change password mutation - Always call hooks at the top level
  const changePasswordMutation = useMutation(
    (data: PasswordChangeData) => apiClient.changePassword(data),
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        // Clear form using refs
        if (currentPasswordRef.current) currentPasswordRef.current.value = '';
        if (newPasswordRef.current) newPasswordRef.current.value = '';
        if (confirmNewPasswordRef.current) confirmNewPasswordRef.current.value = '';
      },
      onError: (error: any) => {
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg || 'Failed to change password');
      },
    }
  );


  // App settings mutation - Always call hooks at the top level
  const saveAppSettingsMutation = useMutation(
    (newSettings: Partial<AppSettings>) => apiClient.updateSettings(newSettings),
    {
      onSuccess: (data, variables) => {
        toast.success('Settings saved successfully');
        // Update the query cache directly without refetching to avoid state conflicts
        // variables contains the newSettings that were sent to the mutation
        queryClient.setQueryData('settings', variables);
        // Mark as no longer dirty since it's saved
        setUiState(prev => ({ ...prev, isPathDirty: false }));
        // Restore focus to download path input after saving
        if (downloadPathRef.current) {
          setTimeout(() => {
            downloadPathRef.current?.focus();
          }, 50);
        }
      },
      onError: (error: any) => {
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg || 'Failed to save settings');
        // Restore focus to download path input even after error
        if (downloadPathRef.current) {
          setTimeout(() => {
            downloadPathRef.current?.focus();
          }, 50);
        }
      },
    }
  );

  // All callbacks defined at top level
  const handleChangePassword = useCallback(() => {
    // Get form data from refs
    const current_password = currentPasswordRef.current?.value?.trim() || '';
    const new_password = newPasswordRef.current?.value?.trim() || '';
    const confirm_password = confirmNewPasswordRef.current?.value?.trim() || '';
    
    // Comprehensive validation
    if (!current_password) {
      toast.error('Please enter your current password');
      if (currentPasswordRef.current) currentPasswordRef.current.focus();
      return;
    }

    if (!new_password) {
      toast.error('Please enter a new password');
      if (newPasswordRef.current) newPasswordRef.current.focus();
      return;
    }

    if (!confirm_password) {
      toast.error('Please confirm your new password');
      if (confirmNewPasswordRef.current) confirmNewPasswordRef.current.focus();
      return;
    }

    if (new_password.length < 6) {
      toast.error('New password must be at least 6 characters long');
      if (newPasswordRef.current) newPasswordRef.current.focus();
      return;
    }

    if (new_password !== confirm_password) {
      toast.error('New passwords do not match. Please ensure both password fields are identical.');
      if (confirmNewPasswordRef.current) confirmNewPasswordRef.current.focus();
      return;
    }

    if (current_password === new_password) {
      toast.error('New password must be different from your current password');
      if (newPasswordRef.current) newPasswordRef.current.focus();
      return;
    }

    // Check password strength
    if (new_password.length < 8) {
      toast.error('For better security, we recommend using a password that is at least 8 characters long');
    }

    changePasswordMutation.mutate({ current_password, new_password, confirm_password });
  }, [changePasswordMutation]);

  const handleAppSettingUpdate = useCallback((key: keyof AppSettings, value: any) => {
    const newSettings = { ...appSettings, [key]: value };
    saveAppSettingsMutation.mutate(newSettings);
  }, [appSettings, saveAppSettingsMutation]);

  const handleDownloadPathBlur = useCallback(() => {
    if (uiState.isPathDirty && uiState.localDownloadPath !== (appSettings?.default_download_path || defaultAppSettings.default_download_path)) {
      handleAppSettingUpdate('default_download_path', uiState.localDownloadPath);
      setUiState(prev => ({ ...prev, isPathDirty: false }));
    }
  }, [uiState.isPathDirty, uiState.localDownloadPath, appSettings?.default_download_path, handleAppSettingUpdate]);

  const handleOpenDirectory = useCallback(() => {
    // Show helpful information about accessing the download directory
    const currentPath = appSettings?.default_download_path || defaultAppSettings.default_download_path;
    const fullPath = currentPath || '';
    
    const message = `Download Directory Path:\n${fullPath}\n\nTo access this directory:\n• macOS: Open Finder and press Cmd+Shift+G, then enter the path\n• Windows: Open File Explorer and paste the path in the address bar\n• Linux: Open file manager and navigate to the path\n\nNote: Web browsers cannot directly open local directories for security reasons.`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullPath).then(() => {
        toast.success('Directory path copied to clipboard!');
        alert(message);
      }).catch(() => {
        alert(message);
      });
    } else {
      alert(message);
    }
  }, [appSettings?.default_download_path]);

  // Early returns after all hooks are defined
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


  return (
    <DashboardLayout>
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your account and system preferences
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Change Password Section */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Lock sx={{ mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Update your account password for security
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type={uiState.showCurrentPassword ? 'text' : 'password'}
                  label="Current Password"
                  defaultValue=""
                  inputRef={currentPasswordRef}
                  InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setUiState(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }))}
                        edge="end"
                      >
                        {uiState.showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type={uiState.showNewPassword ? 'text' : 'password'}
                  label="New Password"
                  defaultValue=""
                  inputRef={newPasswordRef}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                      <IconButton
                        onClick={() => setUiState(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                        edge="end"
                      >
                        {uiState.showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Minimum 6 characters"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type={uiState.showConfirmPassword ? 'text' : 'password'}
                  label="Confirm New Password"
                  defaultValue=""
                  inputRef={confirmNewPasswordRef}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                      <IconButton
                        onClick={() => setUiState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                        edge="end"
                      >
                        {uiState.showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Re-enter your new password"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isLoading}
                  startIcon={<Lock />}
                  sx={{ mt: 2 }}
                >
                  {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Download Settings Section */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Settings sx={{ mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Download Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure where torrents will be downloaded
                </Typography>
              </Box>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Default Download Path"
                  value={uiState.localDownloadPath}
                  inputRef={downloadPathRef}
                  onChange={(e) => {
                    setUiState(prev => ({ ...prev, localDownloadPath: e.target.value, isPathDirty: true }));
                  }}
                  onBlur={handleDownloadPathBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleDownloadPathBlur();
                      if (downloadPathRef.current) {
                        downloadPathRef.current.focus();
                      }
                    }
                  }}
                  helperText={
                    <Box component="span">
                      <span>Where torrents will be downloaded (press Enter or click outside to save)</span>
                      {uiState.isPathDirty && uiState.localDownloadPath !== (appSettings?.default_download_path || defaultAppSettings.default_download_path) && (
                        <span style={{ color: '#ed6c02', marginLeft: '8px', fontWeight: 500 }}>
                          ⚠ Unsaved changes
                        </span>
                      )}
                    </Box>
                  }
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
});

export default function SettingsPage() {
  return (
    <ClientOnly>
      <SettingsPageContent />
    </ClientOnly>
  );
}
