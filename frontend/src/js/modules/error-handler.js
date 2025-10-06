// Error Handler Module
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.listeners = new Map();
  }

  handle(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      context: context,
      type: error.constructor.name || 'Error'
    };

    // Add to log
    this.errorLog.push(errorEntry);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console
    console.error('Error handled:', errorEntry);

    // Emit error event
    this.emit('error', errorEntry);

    // Show user notification if appropriate
    this.showUserNotification(errorEntry);

    return errorEntry;
  }

  showUserNotification(errorEntry) {
    // Only show user notifications for certain types of errors
    const userVisibleErrors = [
      'NetworkError',
      'TypeError',
      'ReferenceError'
    ];

    if (userVisibleErrors.includes(errorEntry.type) || errorEntry.context.userVisible) {
      this.showToast(errorEntry.message, 'error');
    }
  }

  showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Style the toast
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      borderRadius: '4px',
      color: 'white',
      fontSize: '14px',
      zIndex: '10000',
      maxWidth: '300px',
      wordWrap: 'break-word'
    });

    // Set background color based on type
    const colors = {
      'error': '#dc3545',
      'warning': '#ffc107',
      'success': '#28a745',
      'info': '#17a2b8'
    };
    toast.style.backgroundColor = colors[type] || colors['info'];

    // Add to DOM
    document.body.appendChild(toast);

    // Remove after delay
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  getErrorLog() {
    return [...this.errorLog];
  }

  clearErrorLog() {
    this.errorLog = [];
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in error handler listener for event ${event}:`, error);
        }
      });
    }
  }
}

// Create global instance
if (!window.errorHandler) {
  window.errorHandler = new ErrorHandler();
}

// Global error handler
window.addEventListener('error', (event) => {
  window.errorHandler.handle(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    userVisible: true
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  window.errorHandler.handle(event.reason, {
    type: 'UnhandledPromiseRejection',
    userVisible: true
  });
});

