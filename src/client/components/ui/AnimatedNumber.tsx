import { useEffect, useState } from 'react';
import { animate, useMotionValue, useMotionValueEvent } from 'framer-motion';

/** Eases toward `target` so jumpy live values read as smooth motion. */
export function useSmoothed(target: number, duration = 0.7) {
  const mv = useMotionValue(target);
  const [value, setValue] = useState(target);
  useMotionValueEvent(mv, 'change', setValue);
  useEffect(() => {
    const controls = animate(mv, target, { duration, ease: 'easeOut' });
    return () => controls.stop();
  }, [target, duration, mv]);
  return value;
}

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function splitBytes(bytes: number): { value: string; unit: string } {
  if (!isFinite(bytes) || bytes <= 0) return { value: '0', unit: 'B' };
  const i = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const v = bytes / Math.pow(1024, i);
  return { value: v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2), unit: UNITS[i] };
}

interface Props {
  bytesPerSec: number;
  className?: string;
  unitClassName?: string;
}

/** A transfer rate with a large number and a smaller, dimmer unit. */
export function SpeedValue({ bytesPerSec, className, unitClassName }: Props) {
  const smooth = useSmoothed(bytesPerSec);
  const { value, unit } = splitBytes(smooth);
  return (
    <span className={`num ${className ?? ''}`}>
      {value}
      <span className={unitClassName ?? 'text-[0.45em] font-medium text-white/40 ml-1'}>{unit}/s</span>
    </span>
  );
}
