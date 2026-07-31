/**
 * The console's ambient depth: gradient field, drifting cloud deck, data
 * lattice, vignette and the FX scan beam. Purely decorative — rendered behind
 * all content, and sampled by every surface's backdrop-filter.
 */
export function AmbientField() {
  return (
    <>
      <div className="holo-atmos" aria-hidden="true" />
      <div className="holo-nebula" aria-hidden="true" />
      <div className="holo-lattice" aria-hidden="true" />
      <div className="holo-vignette" aria-hidden="true" />
      <div className="holo-beam" aria-hidden="true" />
    </>
  );
}
