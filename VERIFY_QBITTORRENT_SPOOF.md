# WebTorrent → qBittorrent Spoofing Verification

## What Was Changed

The application now identifies itself to trackers as qBittorrent instead of WebTorrent. This allows it to bypass private tracker whitelist rejections.

### Two identification strings were modified:

1. **Peer ID** (in BitTorrent wire protocol and announce URLs)
   - **Before:** `-WW0208-xxxxxxxxxx` (WebTorrent format)
   - **After:** `-qB4650-xxxxxxxxxxxx` (qBittorrent format)
   - Generated randomly at startup for each session

2. **User-Agent HTTP Header** (in tracker HTTP announce requests)
   - **Before:** `WebTorrent/2.8.5 (https://webtorrent.io)`
   - **After:** `qBittorrent/4.6.5`
   - Patched in `node_modules/webtorrent/lib/torrent.js` via postinstall script

## Verification Steps

### 1. Build and Install
```bash
npm install    # Runs postinstall script automatically
npm run build
```

Expected output during `npm install`:
```
✓ Patched webtorrent User-Agent to qBittorrent/4.6.5
```

### 2. Verify the Patch

Check that the User-Agent is patched:
```bash
grep "const USER_AGENT" node_modules/webtorrent/lib/torrent.js
```

Expected output:
```
const USER_AGENT = 'qBittorrent/4.6.5'
```

### 3. Start the Service

```bash
sudo systemctl restart atorrent.service
```

Or using the management script:
```bash
./atorrent.sh stop
./atorrent.sh start
```

### 4. Test with a Private Tracker

1. Open the aTorrent web UI
2. Add a torrent from filelist.io (or another private tracker that previously blocked WebTorrent)
3. Check the logs for any tracker warnings:

```bash
sudo journalctl -u atorrent.service --since "2 minutes ago" --no-pager | grep -i tracker
```

Expected: **No** `[Tracker Warning] Your client is not on the whitelist!` error

Instead, you should see the torrent start downloading with peers connecting.

### 5. Verify Peer ID in Logs (Optional)

Look for debug output showing the qBittorrent peer ID:
```bash
sudo journalctl -u atorrent.service --follow
# You should see peer connections logged with -qB4650- prefix in the peer ID
```

## What This Solves

- ✅ filelist.io torrents now download (previously blocked)
- ✅ Other private trackers with WebTorrent whitelist issues now work
- ✅ Public trackers continue to work normally (they don't check client ID)

## What This Doesn't Change

- The actual torrent engine is still WebTorrent
- No changes to the database schema
- No changes to the API or frontend
- No changes to file storage or download paths
- All existing features work the same way

## Potential Limitations

Some very sophisticated private trackers might:
- Check deeper protocol behavior (extension handshake differences)
- Monitor speed patterns that differ from real qBittorrent
- Track client fingerprints beyond peer_id and User-Agent

However, most private trackers (including filelist.io) only check these two strings.

## If the Patch Fails

If `npm install` shows a warning about the patch not being applied, check:

```bash
ls -la node_modules/webtorrent/lib/torrent.js
grep "USER_AGENT" node_modules/webtorrent/lib/torrent.js
```

If the patch didn't apply, manually run:
```bash
node scripts/patch-webtorrent.js
npm run build
```

## Files Modified

- `src/server/engine/torrent-manager.ts` — adds qBittorrent peer ID generation
- `scripts/patch-webtorrent.js` — new postinstall script to patch User-Agent
- `package.json` — adds postinstall hook
