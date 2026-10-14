import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { Logo } from './components/ui/Logo.js';
import { SetupPage } from './components/auth/SetupPage.js';
import { LoginPage } from './components/auth/LoginPage.js';
import { useAuth } from './hooks/useAuth.js';
import { useSpeedSampler, useSpeedStore } from './hooks/useSpeedHistory.js';
import { formatSpeed } from './lib/formatters.js';
import { wsClient } from './services/ws.js';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }} className="inline-block drop-shadow-[0_0_28px_rgba(99,102,241,0.7)]">
          <Logo size={56} />
        </motion.div>
        <p className="text-white/30 text-xs mt-5 tracking-[0.2em] uppercase">Loading</p>
      </motion.div>
    </div>
  );
}

function Dashboard() {
  useSpeedSampler();

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
  const { status } = useAuth();

  return (
    <>
      <AnimatePresence mode="wait">
        {status === 'loading' && (
          <motion.div key="loading" exit={{ opacity: 0 }}>
            <LoadingScreen />
          </motion.div>
        )}
        {status === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SetupPage />
          </motion.div>
        )}
        {status === 'login' && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginPage />
          </motion.div>
        )}
        {status === 'authenticated' && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen">
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster />
    </>
  );
}
