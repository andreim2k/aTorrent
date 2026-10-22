import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shell } from './components/layout/Shell.js';
import { TorrentList } from './components/torrent/TorrentList.js';
import { TorrentDetail } from './components/torrent/TorrentDetail.js';
import { BulkActionBar } from './components/torrent/BulkActionBar.js';
import { StatsCards } from './components/dashboard/StatsCards.js';
import { AddTorrentModal } from './components/modals/AddTorrentModal.js';
import { SettingsModal } from './components/modals/SettingsModal.js';
import { DeleteConfirmModal } from './components/modals/DeleteConfirmModal.js';
import { VideoPreviewModal } from './components/modals/VideoPreviewModal.js';
import { CommandPalette } from './components/modals/CommandPalette.js';
import { Toaster } from './components/ui/Toaster.js';
import { GlobalDrop } from './components/ui/GlobalDrop.js';
import { useSpeedSampler, useSpeedStore } from './hooks/useSpeedHistory.js';
import { useTorrentSync } from './hooks/useTorrents.js';
import { formatSpeed } from './lib/formatters.js';
import { wsClient } from './services/ws.js';

function Dashboard() {
  useSpeedSampler();
  useTorrentSync();

  useEffect(() => {
    wsClient.connect();
    return () => wsClient.disconnect();
  }, []);

  // Live speed in the browser tab title
  const dl = useSpeedStore((s) => s.points[s.points.length - 1]?.dl ?? 0);
  useEffect(() => {
    document.title = dl > 0 ? `↓ ${formatSpeed(dl)} · aTorrent` : 'aTorrent';
  }, [dl > 0 ? Math.round(dl / 1024) : 0]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Shell>
        <div className="flex h-full max-md:flex-col gap-4">
          <div className="flex-1 min-w-0 overflow-y-auto space-y-4 pb-28 pr-1 max-md:pr-0">
            <StatsCards />
            <TorrentList />
          </div>
          <TorrentDetail />
        </div>
      </Shell>
      <AddTorrentModal />
      <SettingsModal />
      <DeleteConfirmModal />
      <VideoPreviewModal />
      <CommandPalette />
      <BulkActionBar />
      <GlobalDrop />
    </>
  );
}

export function App() {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen">
        <Dashboard />
      </motion.div>
      <Toaster />
    </>
  );
}
