// Global Authentication Interceptor
// Automatically redirects to login when authentication fails

(function() {
  // Store the original fetch function
  const originalFetch = window.fetch;

  // Override the global fetch function
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch.apply(this, args);

      // Check for authentication failure
      if (response.status === 401) {
        console.warn('Authentication expired - redirecting to login');

        // Clear stored tokens
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // Don't redirect if we're already on the login page
        if (!window.location.pathname.includes('/login.html')) {
          window.location.href = '/login.html';
        }

        // Return the response anyway to avoid breaking the calling code
        return response;
      }

      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  console.log('Authentication interceptor initialized');
})();
