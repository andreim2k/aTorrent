'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import apiClient from '@/lib/api';

/**
 * Component that checks for token expiry on page reload/mount
 * and redirects to login if tokens are expired
 */
export function TokenExpiryHandler() {
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // Skip check on public pages
    const publicPages = ['/login', '/register'];
    if (publicPages.includes(pathname)) {
      return;
    }
    
    // Check if tokens are expired on mount
    const isAuthenticated = apiClient.isAuthenticated();
    
    if (!isAuthenticated && typeof window !== 'undefined') {
      // Add a small delay to prevent flash of content
      setTimeout(() => {
        router.push('/login');
      }, 100);
    }
  }, [router, pathname]);

  return null; // This component doesn't render anything
}
