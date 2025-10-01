// API Configuration with automatic fallback
class ApiConfig {
  constructor() {
    this.backends = [
      'prometheus',
      '192.168.50.2'
    ];
    this.currentBackendIndex = 0;
    this.port = 8000;
    this.testEndpoint = '/health';
    this.backendHost = null;
    this.isInitialized = false;
  }

  get baseUrl() {
    if (!this.backendHost) {
      return `http://${this.backends[this.currentBackendIndex]}:${this.port}`;
    }
    return `http://${this.backendHost}:${this.port}`;
  }

  get wsUrl() {
    if (!this.backendHost) {
      return `ws://${this.backends[this.currentBackendIndex]}:${this.port}`;
    }
    return `ws://${this.backendHost}:${this.port}`;
  }

  async testBackend(host) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const response = await fetch(`http://${host}:${this.port}${this.testEndpoint}`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`✓ Backend found at ${host}:${this.port}`);
        return true;
      }
    } catch (error) {
      console.log(`✗ Backend not available at ${host}:${this.port}`);
    }
    return false;
  }

  async initialize() {
    if (this.isInitialized) {
      return this.backendHost;
    }

    console.log('Detecting backend server...');

    // Try each backend in order
    for (let i = 0; i < this.backends.length; i++) {
      const host = this.backends[i];
      const isAvailable = await this.testBackend(host);

      if (isAvailable) {
        this.backendHost = host;
        this.currentBackendIndex = i;
        this.isInitialized = true;
        console.log(`Using backend: ${this.backendHost}:${this.port}`);
        return this.backendHost;
      }
    }

    // If no backend is available, use the first one as fallback
    console.warn('No backend available, using default:', this.backends[0]);
    this.backendHost = this.backends[0];
    this.currentBackendIndex = 0;
    this.isInitialized = true;
    return this.backendHost;
  }

  async fetchWithFallback(endpoint, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      // If request fails, try next backend
      console.warn(`Request failed for ${this.backendHost}, trying fallback...`);
      
      // Try next backend
      if (this.currentBackendIndex < this.backends.length - 1) {
        this.currentBackendIndex++;
        this.backendHost = this.backends[this.currentBackendIndex];
        this.isInitialized = true;
        
        console.log(`Switching to fallback backend: ${this.backendHost}`);
        
        // Retry with new backend
        const fallbackUrl = `${this.baseUrl}${endpoint}`;
        return await fetch(fallbackUrl, options);
      }
      
      throw error;
    }
  }
}

// Create global instance
if (!window.apiConfig) {
  window.apiConfig = new ApiConfig();
}
