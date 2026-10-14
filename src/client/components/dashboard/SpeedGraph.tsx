import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useSpeedStore, type SpeedPoint } from '../../hooks/useSpeedHistory.js';
import { useSmoothed } from '../ui/AnimatedNumber.js';
import { formatSpeed } from '../../lib/formatters.js';

const HEIGHT_DESKTOP = 150;
const HEIGHT_MOBILE = 96;
const PAD_TOP = 20;
const PAD_BOTTOM = 6;
const MIN_SCALE = 256 * 1024; // keep an idle graph from zooming into noise

/** Smooth curve through points using horizontal tangents (no overshoot). */
function curve(pts: [number, number][]): string {
  if (!pts.length) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return d;
}

export function SpeedGraph() {
  const points = useSpeedStore((s) => s.points);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  const uid = useId();
  const HEIGHT = width < 420 ? HEIGHT_MOBILE : HEIGHT_DESKTOP;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rawMax = useMemo(() => Math.max(MIN_SCALE, ...points.map((p) => Math.max(p.dl, p.ul))) * 1.2, [points]);
  const max = useSmoothed(rawMax, 0.8);

  const n = points.length;
  const x = (i: number) => (i / (n - 1)) * width;
  const y = (v: number) => HEIGHT - PAD_BOTTOM - (v / max) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  const series = (key: 'dl' | 'ul') => {
    const pts = points.map((p: SpeedPoint, i): [number, number] => [x(i), y(p[key])]);
    const line = curve(pts);
    return { line, area: `${line} L${width},${HEIGHT} L0,${HEIGHT} Z` };
  };
  const dl = series('dl');
  const ul = series('ul');

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left) / rect.width) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  const hp = hover !== null ? points[hover] : null;
  const hx = hover !== null ? x(hover) : 0;
  const tipLeft = hx > width - 170;

  return (
    <div ref={wrapRef} className="relative w-full select-none" style={{ height: HEIGHT }}>
      <svg
        width={width}
        height={HEIGHT}
        className="block overflow-visible"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Transfer speed over the last 90 seconds"
      >
        <defs>
          <linearGradient id={`${uid}-dl`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#38bdf8" stopOpacity="0.42" />
            <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-ul`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a78bfa" stopOpacity="0.32" />
            <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}-fade`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.12" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <mask id={`${uid}-mask`}>
            <rect width={width} height={HEIGHT} fill={`url(#${uid}-fade)`} />
          </mask>
        </defs>

        {[0.33, 0.66].map((f) => (
          <line key={f} x1={0} x2={width} y1={PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) * f} y2={PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) * f} stroke="white" strokeOpacity="0.05" strokeDasharray="3 6" />
        ))}

        <g mask={`url(#${uid}-mask)`}>
          <path d={ul.area} fill={`url(#${uid}-ul)`} />
          <path d={dl.area} fill={`url(#${uid}-dl)`} />
          <path d={ul.line} fill="none" stroke="#a78bfa" strokeWidth="1.6" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 5px rgba(167,139,250,0.7))' }} />
          <path d={dl.line} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(56,189,248,0.8))' }} />
        </g>

        {/* Live head marker */}
        {hover === null && (
          <g>
            <circle cx={x(n - 1) - 1} cy={y(points[n - 1].dl)} r="3.5" fill="#38bdf8" />
            <circle cx={x(n - 1) - 1} cy={y(points[n - 1].dl)} r="3.5" fill="#38bdf8" className="animate-ping-slow" style={{ transformOrigin: `${x(n - 1) - 1}px ${y(points[n - 1].dl)}px` }} />
          </g>
        )}

        {hp && (
          <g>
            <line x1={hx} x2={hx} y1={0} y2={HEIGHT} stroke="white" strokeOpacity="0.2" />
            <circle cx={hx} cy={y(hp.dl)} r="4" fill="#38bdf8" stroke="#07070b" strokeWidth="2" />
            <circle cx={hx} cy={y(hp.ul)} r="4" fill="#a78bfa" stroke="#07070b" strokeWidth="2" />
          </g>
        )}
        <rect width={width} height={HEIGHT} fill="transparent" />
      </svg>

      {/* Scale label */}
      <div className="absolute top-0 right-0 text-[10px] text-white/25 num pointer-events-none">{formatSpeed(max / 1.2)}</div>

      {hp && (
        <div
          className="absolute top-1 z-10 glass rounded-lg px-2.5 py-1.5 text-[11px] pointer-events-none bg-base-50/90 shadow-float"
          style={{ left: tipLeft ? undefined : hx + 12, right: tipLeft ? width - hx + 12 : undefined }}
        >
          <div className="flex items-center gap-1.5 text-sky-300 num"><span className="w-1.5 h-1.5 rounded-full bg-sky-400" />{formatSpeed(hp.dl)}</div>
          <div className="flex items-center gap-1.5 text-violet-300 num mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-400" />{formatSpeed(hp.ul)}</div>
          <div className="text-white/30 mt-1 num">{Math.round((Date.now() - hp.t) / 1000)}s ago</div>
        </div>
      )}
    </div>
  );
}
