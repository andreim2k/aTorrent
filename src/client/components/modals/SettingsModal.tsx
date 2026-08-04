import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassModal } from '../ui/GlassModal.js';
import { useUIStore } from '../../stores/uiStore.js';
import { usePreferencesStore } from '../../stores/preferencesStore.js';
import { api } from '../../services/api.js';
import { formatBytes } from '../../lib/formatters.js';

const SYSTEM_POLL_INTERVAL_MS = 3000;

type SettingsTab = 'general' | 'downloads' | 'system' | 'media';

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'general', label: 'General',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  },
  {
    id: 'downloads', label: 'Downloads',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  },
  {
    id: 'system', label: 'System',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
  },
  {
    id: 'media', label: 'Media',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /></svg>,
  },
];

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h3 style={{ fontSize: '.875rem' }}>{title}</h3>
      <p className="holo-label" style={{ marginTop: 4 }}>{desc}</p>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" className="holo-toggle" onClick={() => onChange(!checked)} aria-pressed={checked}>
      <span style={{ textAlign: 'left' }}>
        <span style={{ display: 'block', fontSize: '.8125rem' }}>{label}</span>
        <span className="holo-label">{desc}</span>
      </span>
      <span className={`holo-toggle__track ${checked ? 'is-on' : ''}`}>
        <span className="holo-toggle__knob" />
      </span>
    </button>
  );
}

function TextInput({ label, value, onChange, placeholder, mono, type }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean; type?: string;
}) {
  return (
    <label className="holo-field">
      <span className="holo-field__label holo-label">{label}</span>
      <input
        type={type || 'text'}
        className={`holo-input ${mono ? 'holo-input--mono' : ''}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Meter({ percent, tone }: { percent: number; tone: string }) {
  return (
    <div className="holo-meter" style={{ marginBottom: 8 }}>
      <span
        className="holo-meter__fill"
        style={{ width: `${Math.min(100, percent)}%`, background: tone, boxShadow: `0 0 10px ${tone}` }}
      />
    </div>
  );
}

function StatCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="holo-stat">
      <div className="holo-stat__head">{icon}{title}</div>
      {children}
    </div>
  );
}

function SystemTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['system-info'],
    queryFn: api.getSystemInfo,
    refetchInterval: SYSTEM_POLL_INTERVAL_MS,
  });

  if (isLoading) return <p className="holo-label">Reading system telemetry…</p>;
  if (error) return <p className="holo-note holo-note--error">Failed to load system info</p>;
  if (!data) return null;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <StatCard
        title="CPU"
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /></svg>}
      >
        <p className="holo-label" style={{ marginBottom: 10 }}>{data.cpu.model} · {data.cpu.cores} cores</p>
        <Meter percent={data.cpu.loadPercent} tone="var(--cy)" />
        <p className="holo-label">{data.cpu.loadPercent}% load</p>
      </StatCard>

      <StatCard
        title="Memory"
        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 19v-8a6 6 0 0 1 12 0v8" /><rect x="2" y="19" width="20" height="2" rx="1" /></svg>}
      >
        <Meter percent={data.memory.usePercent} tone="var(--ion)" />
        <p className="holo-label">
          {formatBytes(data.memory.used)} / {formatBytes(data.memory.total)} ({data.memory.usePercent}%)
        </p>
      </StatCard>

      {data.disk.map((fs: any, index: number) => (
        <StatCard
          key={index}
          title={`Disk — ${fs.mount}`}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>}
        >
          <Meter percent={fs.usePercent} tone="var(--flux)" />
          <p className="holo-label">
            {formatBytes(fs.used)} / {formatBytes(fs.size)} ({Math.round(fs.usePercent)}%) · {formatBytes(fs.available)} free
          </p>
        </StatCard>
      ))}

      {data.temperature.main !== null && data.temperature.main !== -1 && (
        <StatCard
          title="Thermal"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /></svg>}
        >
          <p className="holo-label">
            CPU {data.temperature.main}°C
            {data.temperature.max !== null && data.temperature.max !== data.temperature.main && ` · max ${data.temperature.max}°C`}
          </p>
        </StatCard>
      )}
    </div>
  );
}

export function SettingsModal() {
  const { showSettingsModal, setShowSettingsModal } = useUIStore();
  const { showSpeedGraph, setShowSpeedGraph, fxEnabled, toggleFx } = usePreferencesStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const { data: serverSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
    enabled: showSettingsModal,
  });

  const [downloadsDir, setDownloadsDir] = useState('');
  const [tmdbApiKey, setTmdbApiKey] = useState('');

  useEffect(() => {
    if (serverSettings) {
      setDownloadsDir(serverSettings.downloadsDir || '');
      setTmdbApiKey(serverSettings.tmdbApiKey || '');
    }
  }, [serverSettings]);

  const save = async () => {
    await api.updateSettings({ downloadsDir, tmdbApiKey });
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    setShowSettingsModal(false);
  };

  return (
    <GlassModal
      open={showSettingsModal}
      onClose={() => setShowSettingsModal(false)}
      index="CFG"
      title="Console Settings"
      wide
      flushBody
      footer={
        <>
          <button className="holo-btn holo-btn--ghost" onClick={() => setShowSettingsModal(false)}>Cancel</button>
          <button className="holo-btn holo-btn--primary" onClick={save}>Save changes</button>
        </>
      }
    >
      <div className="holo-settings">
        <nav className="holo-settings__nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`holo-settings__tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="holo-settings__body">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="holo-settings__pane"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.16 }}
            >
              {activeTab === 'general' && (
                <>
                  <SectionHeader title="Interface" desc="Tune the console presentation" />
                  <Toggle
                    label="Telemetry graph"
                    desc="Show the transfer rate chart"
                    checked={showSpeedGraph}
                    onChange={setShowSpeedGraph}
                  />
                  <Toggle
                    label="Cinematic FX"
                    desc="Ambient motion — scan beam, pulses and meter sweeps"
                    checked={fxEnabled}
                    onChange={toggleFx}
                  />
                </>
              )}

              {activeTab === 'downloads' && (
                <>
                  <SectionHeader title="Download location" desc="Where payloads are written by default" />
                  <TextInput
                    label="Downloads directory"
                    value={downloadsDir}
                    onChange={setDownloadsDir}
                    placeholder="/path/to/downloads"
                    mono
                  />
                </>
              )}

              {activeTab === 'system' && <SystemTab />}

              {activeTab === 'media' && (
                <>
                  <SectionHeader title="TMDB integration" desc="Fetch poster art and media metadata" />
                  <div style={{ display: 'grid', gap: 16 }}>
                    <TextInput
                      label="API read access token"
                      value={tmdbApiKey}
                      onChange={setTmdbApiKey}
                      placeholder="eyJhbGci…"
                      mono
                      type="password"
                    />
                    <div className="holo-note holo-note--info">
                      <span style={{ color: 'var(--cy)' }} aria-hidden="true">◈</span>
                      <span>
                        Get a free key at themoviedb.org/settings/api. Use the
                        <strong style={{ color: 'var(--text-2)' }}> Read Access Token</strong> (starts with “eyJ”), not the API key.
                      </span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </GlassModal>
  );
}
