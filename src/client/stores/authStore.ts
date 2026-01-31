import { create } from 'zustand';

interface AuthState {
  status: 'loading' | 'setup' | 'login' | 'authenticated';
  username: string | null;
  setStatus: (status: AuthState['status']) => void;
  setUsername: (username: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  username: null,
  setStatus: (status) => set({ status }),
  setUsername: (username) => set({ username }),
}));
