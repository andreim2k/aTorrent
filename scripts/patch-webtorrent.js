#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '..', 'node_modules', 'webtorrent', 'lib', 'torrent.js');

try {
  let content = fs.readFileSync(file, 'utf8');

  // Replace the hardcoded USER_AGENT constant with qBittorrent
  const original = content;
  content = content.replace(
    /const USER_AGENT = `WebTorrent\/\$\{VERSION\} \(https:\/\/webtorrent\.io\)`/,
    "const USER_AGENT = 'qBittorrent/4.6.5'"
  );

  if (content === original) {
    console.warn('⚠️  Warning: Could not find WebTorrent USER_AGENT constant. Pattern may have changed.');
    process.exit(0);
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('✓ Patched webtorrent User-Agent to qBittorrent/4.6.5');
} catch (err) {
  console.error('Failed to patch webtorrent:', err.message);
  process.exit(1);
}
