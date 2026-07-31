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
import { AmbientField } from './components/layout/AmbientField.js';
import { useUIStore } from './stores/uiStore.js';
import { usePreferencesStore } from './stores/preferencesStore.js';
import { useAuth } from './hooks/useAuth.js';
import { wsClient } from './services/ws.js';

function BootScreen() {
  const lines = [
    { key: 'SYS', text: 'mounting transfer engine' },
    { key: 'NET', text: 'opening telemetry channel' },
    { key: 'UI', text: 'initialising command console', active: true },
  ];

  return (
    <div className="holo-auth">
      <AmbientField />
      <motion.div className="holo-boot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="holo-auth__mark">a</div>
        {lines.map((line) => (
          <p key={line.key} className={`holo-boot__line ${line.active ? 'is-active' : ''}`}>
            <span className="holo-boot__key">{line.key}</span>
            <span>{line.text}…</span>
          </p>
        ))}
      </motion.div>
    </div>
  );
}

function Console() {
  const selectedTorrent = useUIStore((state) => state.selectedTorrent);
  const showSpeedGraph = usePreferencesStore((state) => state.showSpeedGraph);

  useEffect(() => {
    wsClient.connect();
    return () => wsClient.disconnect();
  }, []);

  return (
    <>
      <Shell>
        <div className="holo-grid">
          <div className="holo-column">
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

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export function App() {
  const { status } = useAuth();
  const fontScale = usePreferencesStore((state) => state.fontScale);
  const fxEnabled = usePreferencesStore((state) => state.fxEnabled);

  // The console is a single design system — only motion and type scale are user-tunable.
  useEffect(() => {
    document.documentElement.dataset.fx = fxEnabled ? 'on' : 'off';
    document.documentElement.style.setProperty('--font-scale', String(fontScale));
  }, [fontScale, fxEnabled]);

  return (
    <AnimatePresence mode="wait">
      {status === 'loading' && <motion.div key="boot" {...fade}><BootScreen /></motion.div>}
      {status === 'setup' && <motion.div key="setup" {...fade}><SetupPage /></motion.div>}
      {status === 'login' && <motion.div key="login" {...fade}><LoginPage /></motion.div>}
      {status === 'authenticated' && (
        <motion.div key="console" {...fade} style={{ height: '100%' }}><Console /></motion.div>
      )}
    </AnimatePresence>
  );
}
