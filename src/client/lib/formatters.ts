export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 1) return '0 B/s';
  const k = 1000;
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
  let i = Math.min(Math.floor(Math.log(bytesPerSec) / Math.log(k)), units.length - 1);
  let val = bytesPerSec / Math.pow(k, i);
  // rounding can push 999.96 to "1000.0" — bump to the next unit instead
  if (Math.round(val * 10) >= 10000 && i < units.length - 1) {
    i++;
    val = bytesPerSec / Math.pow(k, i);
  }
  return parseFloat(val.toFixed(1)) + ' ' + units[i];
}

export function formatETA(ms: number): string {
  if (!isFinite(ms) || ms <= 0) return '∞';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function formatPercent(ratio: number): string {
  return (ratio * 100).toFixed(1) + '%';
}

export function formatDate(date: Date | string | number | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
