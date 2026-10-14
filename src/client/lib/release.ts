export interface Release {
  title: string;
  year?: string;
  episode?: string; // e.g. S02E05 or S02
  chips: { label: string; tone: 'res' | 'src' | 'codec' | 'hdr' | 'audio' }[];
}

const RES = /\b(2160p|4k|uhd|1080p|1080i|720p|576p|480p)\b/i;
const SRC = /\b(remux|blu-?ray|bdrip|brrip|web-?dl|web-?rip|webrip|hdtv|dvdrip|hdrip|amzn|nf|hmax)\b/i;
const CODEC = /\b(x265|hevc|h\.?265|x264|h\.?264|avc|av1|xvid)\b/i;
const HDR = /\b(hdr10\+?|hdr|dolby[ .]?vision|dv)\b/i;
const AUDIO = /\b(atmos|truehd|dts-?hd(?:[ .]ma)?|dts|ddp?5\.1|dd\+?|eac3|ac3|aac|flac|opus)\b/i;
const YEAR = /(?:^|[\s(\[])((?:19|20)\d{2})(?=[\s)\].]|$)/;
const EPISODE = /\bS(\d{1,2})(?:E(\d{1,3}))?\b/i;

function normRes(r: string) {
  const l = r.toLowerCase();
  if (l === '2160p' || l === '4k' || l === 'uhd') return '4K';
  return l.toUpperCase().replace('P', 'p');
}

function normCodec(c: string) {
  const l = c.toLowerCase().replace('.', '');
  if (l === 'x265' || l === 'hevc' || l === 'h265') return 'HEVC';
  if (l === 'x264' || l === 'h264' || l === 'avc') return 'H.264';
  return c.toUpperCase();
}

export function parseRelease(raw: string): Release {
  const cleaned = raw.replace(/\.(mkv|mp4|avi|torrent)$/i, '').replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim();

  const markers: number[] = [];
  const year = cleaned.match(YEAR);
  if (year?.index !== undefined) markers.push(year.index + (year[0].length - year[1].length));
  for (const re of [EPISODE, RES, SRC, CODEC]) {
    const m = cleaned.match(re);
    if (m?.index !== undefined && m.index > 0) markers.push(m.index);
  }
  const cut = markers.filter((i) => i > 1).sort((a, b) => a - b)[0];
  let title = (cut ? cleaned.slice(0, cut) : cleaned).replace(/[\s\-([]+$/, '').trim();
  if (!title) title = cleaned;

  const ep = cleaned.match(EPISODE);
  const episode = ep
    ? `S${ep[1].padStart(2, '0')}${ep[2] ? `E${ep[2].padStart(2, '0')}` : ''}`
    : undefined;

  const chips: Release['chips'] = [];
  const res = cleaned.match(RES);
  if (res) chips.push({ label: normRes(res[1]), tone: 'res' });
  const src = cleaned.match(SRC);
  if (src) chips.push({ label: src[1].toLowerCase() === 'remux' ? 'REMUX' : /web/i.test(src[1]) ? 'WEB' : /blu|bd|br/i.test(src[1]) ? 'BluRay' : src[1].toUpperCase(), tone: 'src' });
  const codec = cleaned.match(CODEC);
  if (codec) chips.push({ label: normCodec(codec[1]), tone: 'codec' });
  const hdr = cleaned.match(HDR);
  if (hdr) chips.push({ label: /dolby|dv/i.test(hdr[1]) ? 'Dolby Vision' : hdr[1].toUpperCase(), tone: 'hdr' });
  const audio = cleaned.match(AUDIO);
  if (audio) chips.push({ label: audio[1].replace(/\./g, '').toUpperCase().replace('ATMOS', 'Atmos'), tone: 'audio' });

  return { title, year: year?.[1], episode, chips };
}

export const chipTone: Record<Release['chips'][number]['tone'], string> = {
  res: 'bg-sky-400/10 text-sky-300 border-sky-400/20',
  src: 'bg-white/[0.05] text-white/55 border-white/10',
  codec: 'bg-violet-400/10 text-violet-300 border-violet-400/20',
  hdr: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  audio: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
};
