import { create } from 'zustand';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, title: string, description?: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;
const MAX_TOASTS = 4;
const LIFETIME_MS = 4200;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (kind, title, description) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, kind, title, description }].slice(-MAX_TOASTS) }));
    setTimeout(() => get().dismiss(id), LIFETIME_MS);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().push('success', title, description),
  error: (title: string, description?: string) => useToastStore.getState().push('error', title, description),
  info: (title: string, description?: string) => useToastStore.getState().push('info', title, description),
};
