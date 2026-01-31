// Bandwidth rate limiter — configured via settings
// WebTorrent handles throttling internally via its options,
// so this module just manages the config values.

let downloadLimit = 0; // 0 = unlimited, bytes/sec
let uploadLimit = 0;

export function setDownloadLimit(bytesPerSec: number) {
  downloadLimit = bytesPerSec;
}

export function setUploadLimit(bytesPerSec: number) {
  uploadLimit = bytesPerSec;
}

export function getLimits() {
  return { downloadLimit, uploadLimit };
}
