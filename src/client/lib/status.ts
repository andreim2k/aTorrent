export type StatusKey = 'downloading' | 'seeding' | 'paused' | 'error' | 'queued' | 'checking';

export const statusMeta: Record<StatusKey, { label: string; color: string; text: string; bg: string; ring: string }> = {
  downloading: { label: 'Downloading', color: '#38bdf8', text: 'text-sky-300', bg: 'bg-sky-400/10', ring: 'ring-sky-400/30' },
  seeding: { label: 'Seeding', color: '#34d399', text: 'text-emerald-300', bg: 'bg-emerald-400/10', ring: 'ring-emerald-400/30' },
  paused: { label: 'Paused', color: '#fbbf24', text: 'text-amber-300', bg: 'bg-amber-400/10', ring: 'ring-amber-400/30' },
  error: { label: 'Error', color: '#fb7185', text: 'text-rose-300', bg: 'bg-rose-400/10', ring: 'ring-rose-400/30' },
  queued: { label: 'Queued', color: '#94a3b8', text: 'text-slate-300', bg: 'bg-slate-400/10', ring: 'ring-slate-400/30' },
  checking: { label: 'Checking', color: '#c084fc', text: 'text-purple-300', bg: 'bg-purple-400/10', ring: 'ring-purple-400/30' },
};

export function getStatus(s: string) {
  return statusMeta[(s as StatusKey)] ?? statusMeta.queued;
}
