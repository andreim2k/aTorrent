/** Slow-drifting aurora blobs, a vignette and film grain behind the whole app. */
export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-[18%] -left-[8%] w-[55vw] h-[55vw] rounded-full bg-indigo-600/25 blur-[120px] animate-blob-a" />
      <div className="absolute top-[30%] -right-[12%] w-[48vw] h-[48vw] rounded-full bg-fuchsia-600/[0.14] blur-[130px] animate-blob-b" />
      <div className="absolute -bottom-[25%] left-[25%] w-[52vw] h-[52vw] rounded-full bg-sky-500/[0.13] blur-[130px] animate-blob-c" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(7,7,11,0.75)_100%)]" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.035] mix-blend-overlay">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}
