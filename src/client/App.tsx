import { Shell } from './components/layout/Shell.js';
import { TorrentList } from './components/torrent/TorrentList.js';
import { TorrentDetail } from './components/torrent/TorrentDetail.js';
import { BulkActionBar } from './components/torrent/BulkActionBar.js';
import { StatsCards } from './components/dashboard/StatsCards.js';
import { SpeedGraph } from './components/dashboard/SpeedGraph.js';
import { AddTorrentModal } from './components/modals/AddTorrentModal.js';
import { SettingsModal } from './components/modals/SettingsModal.js';
import { DeleteConfirmModal } from './components/modals/DeleteConfirmModal.js';
import { SetupPage } from './components/auth/SetupPage.js';
import { LoginPage } from './components/auth/LoginPage.js';
import { useUIStore } from './stores/uiStore.js';
import { usePreferencesStore } from './stores/preferencesStore.js';
import { useAuth } from './hooks/useAuth.js';
import { wsClient } from './services/ws.js';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-indigo to-accent-pink flex items-center justify-center font-bold text-lg mx-auto mb-4 animate-pulse">
          a
        </div>
        <p className="text-white/30 text-sm">Loading...</p>
      </motion.div>
    </div>
  );
}

function Dashboard() {
  const selectedTorrent = useUIStore((s) => s.selectedTorrent);
  const showSpeedGraph = usePreferencesStore((s) => s.showSpeedGraph);

  useEffect(() => {
    wsClient.connect();
    return () => wsClient.disconnect();
  }, []);

  return (
    <>
      <Shell>
        <div className="flex h-full gap-4 max-md:flex-col">
          <div className="flex-1 min-w-0 space-y-4">
            <StatsCards />
            {showSpeedGraph && <SpeedGraph />}
            <TorrentList />
          </div>
          {selectedTorrent && <TorrentDetail />}
        </div>
      </Shell>
      <AddTorrentModal />
      <SettingsModal />
      <DeleteConfirmModal />
      <BulkActionBar />
    </>
  );
}

export function App() {
  const { status } = useAuth();

  return (
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
  );
}
