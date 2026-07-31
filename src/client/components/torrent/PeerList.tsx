interface Props {
  hash: string;
}

// Peer counts arrive on the torrent:progress WS stream; a detailed peer table
// would need a dedicated endpoint.
export function PeerList(_props: Props) {
  return (
    <div className="holo-note holo-note--info">
      <span style={{ color: 'var(--cy)' }} aria-hidden="true">◈</span>
      <span>
        Peer mesh is tracked live on the telemetry channel. Current peer count is shown
        under Overview.
      </span>
    </div>
  );
}
