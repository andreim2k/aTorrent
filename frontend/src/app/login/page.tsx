'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CloudDownload,
  Lock,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
// Removed UserLogin import - using simple password interface
import NextLink from 'next/link';
import ClientOnly from '@/components/ClientOnly';

const loginSchema = yup.object({
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

function LoginPageContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{password: string}>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      password: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: {password: string}, e?: any) => {
    // Prevent default form submission
    if (e) {
      e.preventDefault();
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await login(data.password);
      // The login function will handle redirect on success
    } catch (error: any) {
      // Extract error message from various possible sources
      let errorMessage = 'Invalid password. Please try again.';
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Clean up common error messages
      if (errorMessage.toLowerCase().includes('invalid password')) {
        errorMessage = 'Invalid password. Please try again.';
      }
      
      setError(errorMessage);
      // Keep the form on the page, don't redirect
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.background.default} 100%)`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            sx={{
              maxWidth: 450,
              width: '100%',
              mx: 'auto',
              borderRadius: 4,
              boxShadow: theme.shadows[10],
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                color: 'white',
                p: 4,
                textAlign: 'center',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <CloudDownload sx={{ fontSize: 48, mb: 2 }} />
              </motion.div>
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                aTorrent
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                a Modern Torrent Client
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" align="center" gutterBottom fontWeight={600}>
                Enter Password
              </Typography>
              <Typography
                variant="body2"
                align="center"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Access your torrent client
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} noValidate>
                <TextField
                  {...register('password')}
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoFocus
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{
                    mb: 2,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Access'
                  )}
                </Button>

              </Box>

            </CardContent>
          </Card>
        </motion.div>
      </Box>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <ClientOnly fallback={
      <Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={48} />
      </Container>
    }>
      <LoginPageContent />
    </ClientOnly>
  );
}
