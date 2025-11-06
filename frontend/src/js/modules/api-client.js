// API Client Module
class ApiClient {
  constructor() {
    this.baseUrl = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return this.baseUrl;
    
    // Wait for API config to initialize
    if (!window.apiConfig.isInitialized) {
      await window.apiConfig.initialize();
    }
    
    this.baseUrl = window.apiConfig.baseUrl;
    this.isInitialized = true;
    return this.baseUrl;
  }

  async request(endpoint, options = {}) {
    await this.initialize();

    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await window.apiConfig.fetchWithFallback(endpoint, {
        ...defaultOptions,
        ...options
      });

      // Check for authentication failure
      if (response.status === 401) {
        console.warn('Authentication failed - redirecting to login');
        // Clear any stored tokens
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // Redirect to login page
        window.location.href = '/login.html';
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Create global instance
if (!window.apiClient) {
  window.apiClient = new ApiClient();
}

