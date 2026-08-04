import { useEffect } from 'react';
import { Shell } from './components/layout/Shell.js';
import { TorrentList } from './components/torrent/TorrentList.js';
import { TorrentDetail } from './components/torrent/TorrentDetail.js';
import { BulkActionBar } from './components/torrent/BulkActionBar.js';
import { StatsCards } from './components/dashboard/StatsCards.js';
import { SpeedGraph } from './components/dashboard/SpeedGraph.js';
import { AddTorrentModal } from './components/modals/AddTorrentModal.js';
import { SettingsModal } from './components/modals/SettingsModal.js';
import { DeleteConfirmModal } from './components/modals/DeleteConfirmModal.js';
import { useUIStore } from './stores/uiStore.js';
import { usePreferencesStore } from './stores/preferencesStore.js';
import { wsClient } from './services/ws.js';

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

export function App() {
  const fontScale = usePreferencesStore((state) => state.fontScale);
  const fxEnabled = usePreferencesStore((state) => state.fxEnabled);

  // The console is a single design system — only motion and type scale are user-tunable.
  useEffect(() => {
    document.documentElement.dataset.fx = fxEnabled ? 'on' : 'off';
    document.documentElement.style.setProperty('--font-scale', String(fontScale));
  }, [fontScale, fxEnabled]);

  return <Console />;
}
