import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/uiStore.js';
import { usePreferencesStore } from '../../stores/preferencesStore.js';
import { api } from '../../services/api.js';

const SAVED_FEEDBACK_DURATION_MS = 2000;

type SettingsTab = 'general' | 'downloads' | 'network' | 'media' | 'security';

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'general', label: 'General',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  },
  {
    id: 'downloads', label: 'Downloads',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  },
  {
    id: 'network', label: 'Network',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>,
  },
  {
    id: 'media', label: 'Media',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /></svg>,
  },
  {
    id: 'security', label: 'Security',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  },
];

function GeneralTabContent({ showSpeedGraph, setShowSpeedGraph }: {
  showSpeedGraph: boolean;
  setShowSpeedGraph: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Interface" desc="Customize the look and feel" />
      <div className="space-y-3">
        <Toggle label="Speed Graph" desc="Show download/upload chart on dashboard" checked={showSpeedGraph} onChange={setShowSpeedGraph} />
      </div>
    </div>
  );
}

function DownloadsTabContent({ downloadsDir, setDownloadsDir }: {
  downloadsDir: string;
  setDownloadsDir: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Download Location" desc="Where torrents are saved by default" />
      <TextInput
        label="Downloads Directory"
        value={downloadsDir}
        onChange={setDownloadsDir}
        placeholder="/path/to/downloads"
        mono
      />
    </div>
  );
}

function NetworkTabContent({ downloadLimit, setDownloadLimit, uploadLimit, setUploadLimit }: {
  downloadLimit: string;
  setDownloadLimit: (v: string) => void;
  uploadLimit: string;
  setUploadLimit: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Bandwidth Limits" desc="Set to 0 for unlimited" />
      <div className="grid grid-cols-2 gap-4">
        <NumberInputBlock label="Download" unit="KB/s" value={downloadLimit} onChange={setDownloadLimit} color="text-blue-400" />
        <NumberInputBlock label="Upload" unit="KB/s" value={uploadLimit} onChange={setUploadLimit} color="text-purple-400" />
      </div>
    </div>
  );
}

function MediaTabContent({ tmdbApiKey, setTmdbApiKey }: {
  tmdbApiKey: string;
  setTmdbApiKey: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title="TMDB Integration" desc="Auto-fetch poster art and media metadata" />
      <TextInput
        label="API Read Access Token"
        value={tmdbApiKey}
        onChange={setTmdbApiKey}
        placeholder="eyJhbGci..."
        mono
        type="password"
      />
      <div className="glass rounded-lg p-3 flex items-start gap-3">
        <svg className="text-accent-indigo flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div className="text-xs text-white/40 leading-relaxed">
          <p>Get a free API key at <span className="text-white/60">themoviedb.org/settings/api</span></p>
          <p className="mt-1">Copy the <span className="text-white/60">Read Access Token</span> (starts with "eyJ..."), not the API Key.</p>
        </div>
      </div>
    </div>
  );
}

function SecurityTabContent() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    setError('');
    setSuccess(false);
    if (!currentPassword) { setError('Current password is required'); return; }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('New passwords do not match'); return; }
    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 2000);
    } catch (e: any) {
      setError(e.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Change Password" desc="Update your account password" />
      <div className="space-y-4">
        <TextInput label="Current Password" value={currentPassword} onChange={setCurrentPassword} type="password" />
        <TextInput label="New Password" value={newPassword} onChange={setNewPassword} type="password" />
        <TextInput label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            className="text-xs text-green-400 bg-green-500/10 rounded-lg px-3 py-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            Password changed successfully
          </motion.p>
        )}
      </AnimatePresence>
      <button
        onClick={handleChangePassword}
        disabled={loading}
        className="px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-accent-indigo to-accent-purple hover:brightness-110 transition-all disabled:opacity-50"
      >
        {loading ? 'Changing...' : 'Change Password'}
      </button>
    </div>
  );
}

export function SettingsModal() {
  const { showSettingsModal, setShowSettingsModal } = useUIStore();
  const { showSpeedGraph, setShowSpeedGraph } = usePreferencesStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const { data: serverSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: api.getSettings,
    enabled: showSettingsModal,
  });

  const [downloadLimit, setDownloadLimit] = useState('0');
  const [uploadLimit, setUploadLimit] = useState('0');
  const [downloadsDir, setDownloadsDir] = useState('');
  const [tmdbApiKey, setTmdbApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (serverSettings) {
      setDownloadLimit(String(serverSettings.downloadLimit || 0));
      setUploadLimit(String(serverSettings.uploadLimit || 0));
      setDownloadsDir(serverSettings.downloadsDir || '');
      setTmdbApiKey(serverSettings.tmdbApiKey || '');
    }
  }, [serverSettings]);

  const save = async () => {
    await api.updateSettings({
      downloadLimit: parseInt(downloadLimit) || 0,
      uploadLimit: parseInt(uploadLimit) || 0,
      downloadsDir,
      tmdbApiKey,
    });
    qc.invalidateQueries({ queryKey: ['settings'] });
    setSaved(true);
    setTimeout(() => setSaved(false), SAVED_FEEDBACK_DURATION_MS);
  };

  if (!showSettingsModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowSettingsModal(false)}
      />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="glass rounded-2xl w-full max-w-2xl overflow-hidden"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-lg font-semibold">Settings</h2>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex min-h-[420px]">
            {/* Tab sidebar */}
            <nav className="w-44 border-r border-white/[0.06] p-2 flex-shrink-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all mb-0.5 ${
                    activeTab === tab.id
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03]'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-accent-indigo' : ''}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Tab content */}
            <div className="flex-1 p-6 overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeTab === 'general' && (
                    <GeneralTabContent showSpeedGraph={showSpeedGraph} setShowSpeedGraph={setShowSpeedGraph} />
                  )}
                  {activeTab === 'downloads' && (
                    <DownloadsTabContent downloadsDir={downloadsDir} setDownloadsDir={setDownloadsDir} />
                  )}
                  {activeTab === 'network' && (
                    <NetworkTabContent
                      downloadLimit={downloadLimit}
                      setDownloadLimit={setDownloadLimit}
                      uploadLimit={uploadLimit}
                      setUploadLimit={setUploadLimit}
                    />
                  )}
                  {activeTab === 'media' && (
                    <MediaTabContent tmdbApiKey={tmdbApiKey} setTmdbApiKey={setTmdbApiKey} />
                  )}
                  {activeTab === 'security' && <SecurityTabContent />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                saved
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gradient-to-r from-accent-indigo to-accent-purple hover:brightness-110'
              }`}
            >
              {saved ? 'Saved' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-1">
      <h3 className="text-sm font-medium text-white/90">{title}</h3>
      <p className="text-xs text-white/30 mt-0.5">{desc}</p>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-white/[0.02] transition-all">
      <div>
        <span className="text-sm text-white/80 block">{label}</span>
        <span className="text-xs text-white/30">{desc}</span>
      </div>
      <div
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        className={`w-10 h-[22px] rounded-full transition-colors relative flex-shrink-0 ml-4 ${
          checked ? 'bg-accent-indigo' : 'bg-white/10'
        }`}
      >
        <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
        }`} />
      </div>
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder, mono, type }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-white/40 block mb-1.5 font-medium uppercase tracking-wider">{label}</label>
      <input
        type={type || 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm
          placeholder:text-white/15 focus:outline-none focus:border-accent-indigo/40 focus:bg-white/[0.06] transition-all
          ${mono ? 'font-mono text-xs' : ''}`}
      />
    </div>
  );
}

function NumberInputBlock({ label, unit, value, onChange, color }: {
  label: string; unit: string; value: string; onChange: (v: string) => void; color: string;
}) {
  return (
    <div className="glass rounded-lg p-3">
      <label className={`text-xs font-medium block mb-2 ${color}`}>{label}</label>
      <div className="flex items-stretch gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm
            font-mono focus:outline-none focus:border-accent-indigo/40 transition-all"
        />
        <div className="flex items-center px-2">
          <span className="text-xs text-white/40 font-mono whitespace-nowrap">{unit}</span>
        </div>
      </div>
    </div>
  );
}
