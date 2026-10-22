import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App.js';
import '@fontsource-variable/geist/wght.css';
import '@fontsource-variable/geist-mono/wght.css';
import './styles/globals.css';
import './styles/animations.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // The default ('online') pauses every fetch while the browser *thinks* it is offline. On phones that
      // signal flaps over VPNs/tailscale and fetching stays paused until an 'online' event, which showed up as
      // a 15 s blank screen. A failed request already reports its own error, so just try.
      networkMode: 'always',
    },
    mutations: {
      networkMode: 'always',
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
