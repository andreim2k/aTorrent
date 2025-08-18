'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Immediate redirect to login - let the auth system handle the rest
    router.replace('/login');
  }, [router]);

  // Return a minimal loading state
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif'
    }}>
      Redirecting to login...
    </div>
  );
}
