/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format speed (bytes per second) to human readable string
 */
export function formatSpeed(bytesPerSecond: number, decimals = 1): string {
  if (bytesPerSecond === 0) return '0 B/s';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];

  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));

  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration in seconds to human readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds === 0 || !isFinite(seconds)) return '∞';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && days === 0) parts.push(`${secs}s`);

  return parts.length > 0 ? parts.slice(0, 2).join(' ') : '0s';
}

/**
 * Format ETA (estimated time of arrival) in seconds
 */
export function formatETA(seconds: number): string {
  if (seconds <= 0 || !isFinite(seconds)) return '∞';
  
  return formatDuration(seconds);
}

/**
 * Format ratio to human readable string
 */
export function formatRatio(ratio: number, decimals = 2): string {
  if (!isFinite(ratio)) return '∞';
  return ratio.toFixed(decimals);
}

/**
 * Format percentage with specified decimals
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

/**
 * Format date to short date string
 */
export function formatShortDate(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  return target.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: target.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Format date to full date and time string
 */
export function formatFullDate(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  return target.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get status color for torrent status
 */
export function getStatusColor(status: string): 'primary' | 'success' | 'warning' | 'error' | 'default' {
  switch (status.toLowerCase()) {
    case 'downloading':
      return 'primary';
    case 'seeding':
    case 'completed':
      return 'success';
    case 'paused':
      return 'default';
    case 'error':
      return 'error';
    case 'checking':
      return 'warning';
    default:
      return 'default';
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Format torrent priority to human readable string
 */
export function formatPriority(priority: number): string {
  switch (priority) {
    case 0:
      return 'Low';
    case 1:
      return 'Normal';
    case 2:
      return 'High';
    default:
      return 'Normal';
  }
}

/**
 * Format uptime in seconds to human readable string (for system info)
 */
export function formatUptime(seconds: number): string {
  if (seconds === 0 || !isFinite(seconds) || seconds < 0) return 'Unknown';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0 && days === 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (secs > 0 && days === 0 && hours === 0) parts.push(`${secs} second${secs > 1 ? 's' : ''}`);

  if (parts.length === 0) return '0 seconds';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts.join(' and ');
  
  // For 3+ parts, show first two parts only
  return parts.slice(0, 2).join(' and ');
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: number): 'success' | 'default' | 'warning' {
  switch (priority) {
    case 0:
      return 'default';
    case 1:
      return 'success';
    case 2:
      return 'warning';
    default:
      return 'success';
  }
}
