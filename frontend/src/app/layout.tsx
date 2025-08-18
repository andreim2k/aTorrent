'use client';

import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { darkTheme } from '@/lib/theme';
import { AuthProvider } from '@/hooks/useAuth';
import { TokenExpiryHandler } from '@/components/TokenExpiryHandler';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Move QueryClient creation to a function to avoid SSR issues
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create a stable QueryClient instance
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="aTorrent - a Modern torrent client web application" />
        <title>aTorrent - a Modern Torrent Client</title>
        
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#121212" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="aTorrent" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TokenExpiryHandler />
            <NotificationProvider>
              <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '8px',
                  },
                }}
              />
              </ThemeProvider>
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
