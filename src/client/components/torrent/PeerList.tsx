interface Props {
  hash: string;
}

export function PeerList({ hash }: Props) {
  // Peer info comes from the torrent:progress WS events;
  // detailed peer list would require an additional API endpoint
  return (
    <div className="text-xs text-white/40">
      <p>Peer details are updated in real-time via the torrent status.</p>
      <p className="mt-2">Check the Overview tab for peer count.</p>
    </div>
  );
}
