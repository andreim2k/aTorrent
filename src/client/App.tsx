import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

function LoadingScreen() {
  return (
    <div className="terminal-root min-h-screen flex items-center justify-center">
      <motion.div className="boot-sequence" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="boot-mark">a</div>
        <p><span>SYS</span> mounting torrent engine...</p>
        <p><span>NET</span> opening websocket channel...</p>
        <p className="boot-active"><span>UI</span> loading operator console <b>_</b></p>
      </motion.div>
    </div>
  );
}

function Dashboard() {
  const selectedTorrent = useUIStore((state) => state.selectedTorrent);
  const showSpeedGraph = usePreferencesStore((state) => state.showSpeedGraph);

  useEffect(() => {
    wsClient.connect();
    return () => wsClient.disconnect();
  }, []);

  return (
    <>
      <Shell>
        <div className="workspace-grid">
          <div className="workspace-main">
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
  const theme = usePreferencesStore((state) => state.theme);
  const fontScale = usePreferencesStore((state) => state.fontScale);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === 'github-light' ? 'light' : 'dark';
    document.documentElement.style.setProperty('--font-scale', String(fontScale));
  }, [theme, fontScale]);

  return (
    <AnimatePresence mode="wait">
      {status === 'loading' && <motion.div key="loading" exit={{ opacity: 0 }}><LoadingScreen /></motion.div>}
      {status === 'setup' && <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SetupPage /></motion.div>}
      {status === 'login' && <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><LoginPage /></motion.div>}
      {status === 'authenticated' && <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen"><Dashboard /></motion.div>}
    </AnimatePresence>
  );
}
