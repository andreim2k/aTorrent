import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { api } from '../services/api.js';

export function useAuth() {
  const { status, username, setStatus, setUsername } = useAuthStore();

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.authStatus();
      if (res.setupRequired) {
        setStatus('setup');
      } else if (res.authenticated) {
        setStatus('authenticated');
        setUsername(res.username);
      } else {
        setStatus('login');
      }
    } catch {
      setStatus('login');
    }
  }, [setStatus, setUsername]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (user: string, password: string) => {
    const res = await api.login(user, password);
    setStatus('authenticated');
    setUsername(user);
    return res;
  };

  const setup = async (user: string, password: string) => {
    const res = await api.setup(user, password);
    setStatus('authenticated');
    setUsername(user);
    return res;
  };

  const logout = async () => {
    await api.logout();
    setStatus('login');
    setUsername(null);
  };

  return { status, username, login, setup, logout, checkAuth };
}
